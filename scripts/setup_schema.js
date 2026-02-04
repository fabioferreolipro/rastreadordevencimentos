import readline from 'readline';

const BASE_URL = 'https://centraldedados.duckdns.org';
const PROJECT_PREFIX = 'rastreador_de_vencimentos';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

const toYesNo = (value) => (value ? 'Sim' : 'Não');

const safeJson = async (resp) => {
  try {
    return await resp.json();
  } catch {
    return null;
  }
};

const tryAuth = async ({ email, password, endpoint }) => {
  const resp = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password })
  });

  const data = await safeJson(resp);
  if (!resp.ok || !data?.token) {
    const details = data?.message || data?.data || resp.statusText;
    const error = new Error(`Auth falhou em ${endpoint}: HTTP ${resp.status} - ${String(details)}`);
    error.status = resp.status;
    throw error;
  }

  return data.token;
};

const adminAuthenticate = async ({ email, password }) => {
  const candidates = [
    '/api/superusers/auth-with-password',
    '/api/admins/auth-with-password'
  ];

  let lastErr = null;
  for (const endpoint of candidates) {
    try {
      return await tryAuth({ email, password, endpoint });
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error('Falha na autenticação admin.');
};

const getCollectionByName = async ({ headers, name }) => {
  const resp = await fetch(`${BASE_URL}/api/collections/${name}`, { headers });
  if (!resp.ok) return null;
  return await resp.json();
};

const upsertCollection = async ({ headers, collection }) => {
  const existing = await getCollectionByName({ headers, name: collection.name });
  if (existing?.id) {
    const resp = await fetch(`${BASE_URL}/api/collections/${existing.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ ...collection, id: existing.id })
    });
    const data = await safeJson(resp);
    if (!resp.ok) {
      const details = data?.message || data?.data || resp.statusText;
      throw new Error(`Falha ao atualizar ${collection.name}: HTTP ${resp.status} - ${String(details)}`);
    }
    return { action: 'updated', record: data };
  }

  const resp = await fetch(`${BASE_URL}/api/collections`, {
    method: 'POST',
    headers,
    body: JSON.stringify(collection)
  });
  const data = await safeJson(resp);
  if (!resp.ok) {
    const details = data?.message || data?.data || resp.statusText;
    throw new Error(`Falha ao criar ${collection.name}: HTTP ${resp.status} - ${String(details)}`);
  }
  return { action: 'created', record: data };
};

const mkReportRow = ({ name, fields, rules, rbacActive, perfImpact }) => {
  const fieldsText = (fields || []).map(f => f.name).join(', ');
  const rulesText = `list:${rules.listRule ?? 'null'} | view:${rules.viewRule ?? 'null'} | create:${rules.createRule ?? 'null'} | update:${rules.updateRule ?? 'null'} | delete:${rules.deleteRule ?? 'null'}`;
  return `| ${name} | ${fieldsText} | ${rulesText} | ${toYesNo(rbacActive)} | ${perfImpact} |`;
};

async function main() {
  console.log("🚀 Iniciando configuração do Schema PocketBase (Backend-first)...");
  
  const email = process.env.PB_ADMIN_EMAIL || await ask('Digite o Email do Admin: ');
  const password = process.env.PB_ADMIN_PASSWORD || await ask('Digite a Senha do Admin: ');
  rl.close();

  if (!email || !password) {
    console.error("❌ Credenciais inválidas.");
    process.exit(1);
  }

  // 1. Authenticate
  let token = '';
  try {
    token = await adminAuthenticate({ email, password });
    console.log("✅ Autenticado com sucesso.");
  } catch (err) {
    console.error("❌ Erro crítico de autenticação:", err.message);
    process.exit(1);
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token
  };

  const collectionUsuariosName = `${PROJECT_PREFIX}_usuarios`;
  const collectionCategoriasName = `${PROJECT_PREFIX}_categorias`;
  const collectionContasName = `${PROJECT_PREFIX}_contas`;
  const collectionAuditLogsName = `${PROJECT_PREFIX}_audit_logs`;

  const usuariosDraft = {
    name: collectionUsuariosName,
    type: 'auth',
    schema: [
      { name: 'role', type: 'select', required: true, options: { values: ['admin', 'user'] } }
    ],
    authOptions: {
      allowEmailAuth: true,
      requireEmail: true,
      minPasswordLength: 8
    },
    listRule: 'id = @request.auth.id',
    viewRule: 'id = @request.auth.id',
    createRule: '',
    updateRule: 'id = @request.auth.id',
    deleteRule: 'id = @request.auth.id'
  };

  console.log(`\n🔎 Inspecionando coleções existentes...`);
  const usuariosExisting = await getCollectionByName({ headers, name: collectionUsuariosName });
  if (usuariosExisting) {
    console.log(`✅ Encontrada: ${collectionUsuariosName} (id=${usuariosExisting.id})`);
  } else {
    console.log(`ℹ️ Não encontrada: ${collectionUsuariosName} (será criada)`);
  }

  const usuariosUpsert = await upsertCollection({ headers, collection: usuariosDraft });
  console.log(`⚡ Usuarios: ${usuariosUpsert.action}`);

  const usuarios = await getCollectionByName({ headers, name: collectionUsuariosName });
  if (!usuarios?.id) throw new Error(`Coleção ${collectionUsuariosName} não disponível após upsert.`);

  const categoriasDraft = {
    name: collectionCategoriasName,
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      { name: 'color', type: 'text', required: true },
      { name: 'icon', type: 'text', required: false },
      {
        name: 'userId',
        type: 'relation',
        required: true,
        options: { collectionId: usuarios.id, cascadeDelete: true, maxSelect: 1 }
      }
    ],
    listRule: "userId = @request.auth.id || @request.auth.role = 'admin'",
    viewRule: "userId = @request.auth.id || @request.auth.role = 'admin'",
    createRule: "",
    updateRule: "userId = @request.auth.id || @request.auth.role = 'admin'",
    deleteRule: "userId = @request.auth.id || @request.auth.role = 'admin'"
  };

  const contasDraft = {
    name: collectionContasName,
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      { name: 'amount', type: 'number', required: true },
      { name: 'paidAmount', type: 'number', required: false },
      { name: 'issueDate', type: 'date', required: true },
      { name: 'dueDate', type: 'date', required: true },
      { name: 'paymentDate', type: 'date', required: false },
      { name: 'paymentMethod', type: 'select', required: false, options: { values: ['pix', 'boleto', 'cartao_credito', 'dinheiro', 'transferencia'] } },
      { name: 'exactPaymentTimestamp', type: 'date', required: false },
      { name: 'delayDays', type: 'number', required: false },
      {
        name: 'status',
        type: 'select',
        required: true,
        options: { values: ['paid', 'paid_partial', 'pending', 'overdue', 'on_time', 'early'] }
      },
      { name: 'isRecurring', type: 'bool', required: true },
      { name: 'frequency', type: 'select', required: false, options: { values: ['weekly', 'monthly', 'annual'] } },
      { name: 'notes', type: 'text', required: false },
      { name: 'receiptId', type: 'text', required: false },
      { name: 'isTrashed', type: 'bool', required: true },
      { name: 'trashedAt', type: 'date', required: false },
      {
        name: 'category',
        type: 'relation',
        required: false,
        options: { collectionId: '', cascadeDelete: false, maxSelect: 1 }
      },
      {
        name: 'userId',
        type: 'relation',
        required: true,
        options: { collectionId: usuarios.id, cascadeDelete: true, maxSelect: 1 }
      }
    ],
    listRule: "userId = @request.auth.id || @request.auth.role = 'admin'",
    viewRule: "userId = @request.auth.id || @request.auth.role = 'admin'",
    createRule: "",
    updateRule: "userId = @request.auth.id || @request.auth.role = 'admin'",
    deleteRule: "userId = @request.auth.id || @request.auth.role = 'admin'"
  };

  const categoriasUpsert = await upsertCollection({ headers, collection: categoriasDraft });
  console.log(`⚡ Categorias: ${categoriasUpsert.action}`);

  const categorias = await getCollectionByName({ headers, name: collectionCategoriasName });
  if (!categorias?.id) throw new Error(`Coleção ${collectionCategoriasName} não disponível após upsert.`);

  const categoryField = contasDraft.schema.find(f => f.name === 'category');
  if (categoryField) categoryField.options.collectionId = categorias.id;

  const contasUpsert = await upsertCollection({ headers, collection: contasDraft });
  console.log(`⚡ Contas: ${contasUpsert.action}`);

  const contas = await getCollectionByName({ headers, name: collectionContasName });
  if (!contas?.id) throw new Error(`Coleção ${collectionContasName} não disponível após upsert.`);

  const auditLogsDraft = {
    name: collectionAuditLogsName,
    type: 'base',
    schema: [
      { name: 'billId', type: 'relation', required: true, options: { collectionId: contas.id, maxSelect: 1, cascadeDelete: true } },
      { name: 'userId', type: 'relation', required: true, options: { collectionId: usuarios.id, maxSelect: 1, cascadeDelete: true } },
      { name: 'fieldChanged', type: 'text', required: true },
      { name: 'oldValue', type: 'text', required: false },
      { name: 'newValue', type: 'text', required: true },
      { name: 'reason', type: 'text', required: true },
      { name: 'timestamp', type: 'date', required: false }
    ],
    listRule: "@request.auth.role = 'admin' || userId = @request.auth.id",
    viewRule: "@request.auth.role = 'admin' || userId = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: null
  };

  const auditUpsert = await upsertCollection({ headers, collection: auditLogsDraft });
  console.log(`⚡ Audit logs: ${auditUpsert.action}`);

  const reportRows = [];
  reportRows.push(mkReportRow({
    name: collectionUsuariosName,
    fields: usuariosDraft.schema,
    rules: {
      listRule: usuariosDraft.listRule,
      viewRule: usuariosDraft.viewRule,
      createRule: usuariosDraft.createRule,
      updateRule: usuariosDraft.updateRule,
      deleteRule: usuariosDraft.deleteRule
    },
    rbacActive: true,
    perfImpact: 2
  }));

  reportRows.push(mkReportRow({
    name: collectionCategoriasName,
    fields: categoriasDraft.schema,
    rules: {
      listRule: categoriasDraft.listRule,
      viewRule: categoriasDraft.viewRule,
      createRule: categoriasDraft.createRule,
      updateRule: categoriasDraft.updateRule,
      deleteRule: categoriasDraft.deleteRule
    },
    rbacActive: true,
    perfImpact: 3
  }));

  reportRows.push(mkReportRow({
    name: collectionContasName,
    fields: contasDraft.schema,
    rules: {
      listRule: contasDraft.listRule,
      viewRule: contasDraft.viewRule,
      createRule: contasDraft.createRule,
      updateRule: contasDraft.updateRule,
      deleteRule: contasDraft.deleteRule
    },
    rbacActive: true,
    perfImpact: 5
  }));

  reportRows.push(mkReportRow({
    name: collectionAuditLogsName,
    fields: auditLogsDraft.schema,
    rules: {
      listRule: auditLogsDraft.listRule,
      viewRule: auditLogsDraft.viewRule,
      createRule: auditLogsDraft.createRule,
      updateRule: auditLogsDraft.updateRule,
      deleteRule: auditLogsDraft.deleteRule
    },
    rbacActive: true,
    perfImpact: 4
  }));

  console.log("\n📋 Relatório (Schema/RBAC/Performance)\n");
  console.log("| Coleção | Campos Criados | Status Rules | RBAC Ativo? | Impacto Performance (0-10) |");
  console.log("|---|---|---|---|---|");
  for (const row of reportRows) console.log(row);

  console.log("\n🏁 Configuração concluída.");
}

main();

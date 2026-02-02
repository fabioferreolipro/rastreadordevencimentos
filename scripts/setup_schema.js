import readline from 'readline';

const BASE_URL = 'https://centraldedados.duckdns.org';
const PROJECT_PREFIX = 'rastreador_de_vencimentos';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("🚀 Iniciando configuração do Schema PocketBase Reestruturado...");
  
  const email = await ask('Digite o Email do Admin: ');
  const password = await ask('Digite a Senha do Admin: ');
  rl.close();

  if (!email || !password) {
    console.error("❌ Credenciais inválidas.");
    process.exit(1);
  }

  // 1. Authenticate
  let token = '';
  try {
    const resp = await fetch(`${BASE_URL}/api/superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: email, password })
    });

    if (resp.ok) {
      const data = await resp.json();
      token = data.token;
      console.log("✅ Autenticado com sucesso.");
    } else {
      throw new Error(`Falha na autenticação: ${resp.statusText}`);
    }
  } catch (err) {
    console.error("❌ Erro crítico de autenticação:", err.message);
    process.exit(1);
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token
  };

  // 2. Define Schema
  const collections = [
    {
      name: `${PROJECT_PREFIX}_usuarios`,
      type: 'auth',
      schema: [
        { name: 'role', type: 'select', required: true, options: { values: ['admin', 'user'] } }
      ],
      listRule: "id = @request.auth.id",
      viewRule: "id = @request.auth.id",
      createRule: "",
      updateRule: "id = @request.auth.id",
      deleteRule: "id = @request.auth.id",
    },
    {
      name: `${PROJECT_PREFIX}_bills`,
      type: 'base',
      schema: [
        { name: 'name', type: 'text', required: true },
        { name: 'amount', type: 'number', required: true },
        { name: 'paidAmount', type: 'number', required: false },
        { name: 'issueDate', type: 'date', required: true },
        { name: 'dueDate', type: 'date', required: true },
        { name: 'paymentDate', type: 'date', required: false },
        { name: 'exactPaymentTimestamp', type: 'date', required: false },
        { name: 'delayDays', type: 'number', required: false },
        { 
          name: 'status', 
          type: 'select', 
          required: true, 
          options: { values: ['paid', 'paid_partial', 'pending', 'overdue'] } 
        },
        { name: 'isRecurring', type: 'bool' },
        { name: 'frequency', type: 'select', options: { values: ['weekly', 'monthly', 'annual'] } },
        { name: 'notes', type: 'text' },
        { 
          name: 'user', 
          type: 'relation', 
          required: true, 
          options: { collectionId: '', cascadeDelete: true, maxSelect: 1 } 
        }
      ],
      listRule: "user = @request.auth.id",
      viewRule: "user = @request.auth.id",
      createRule: "user = @request.auth.id",
      updateRule: "user = @request.auth.id",
      deleteRule: "user = @request.auth.id",
    },
    {
      name: `${PROJECT_PREFIX}_audit_logs`,
      type: 'base',
      schema: [
        { name: 'billId', type: 'relation', required: true, options: { collectionId: '', maxSelect: 1 } },
        { name: 'userId', type: 'relation', required: true, options: { collectionId: '', maxSelect: 1 } },
        { name: 'fieldChanged', type: 'text', required: true },
        { name: 'oldValue', type: 'text' },
        { name: 'newValue', type: 'text', required: true },
        { name: 'reason', type: 'text', required: true }
      ],
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin' || userId = @request.auth.id",
      createRule: "@request.auth.id != ''", // Automatic creation via service
      updateRule: null,
      deleteRule: null,
    }
  ];

  // 3. Apply Schema
  for (const col of collections) {
    console.log(`\n🔍 Verificando coleção: ${col.name}...`);
    
    // Fetch User collection ID for relations
    if (col.name.includes('_bills') || col.name.includes('_audit_logs')) {
       const userColRes = await fetch(`${BASE_URL}/api/collections/${PROJECT_PREFIX}_usuarios`, { headers });
       if (userColRes.ok) {
         const userCol = await userColRes.json();
         const userField = col.schema.find(f => f.name === 'user' || f.name === 'userId');
         if (userField) userField.options.collectionId = userCol.id;
         
         if (col.name.includes('_audit_logs')) {
            const billColRes = await fetch(`${BASE_URL}/api/collections/${PROJECT_PREFIX}_bills`, { headers });
            if (billColRes.ok) {
               const billCol = await billColRes.json();
               const billField = col.schema.find(f => f.name === 'billId');
               if (billField) billField.options.collectionId = billCol.id;
            }
         }
       }
    }

    let existing = null;
    try {
      const check = await fetch(`${BASE_URL}/api/collections/${col.name}`, { headers });
      if (check.ok) existing = await check.json();
    } catch (e) {}

    if (existing) {
      console.log(`⚡ Atualizando coleção existente: ${col.name}`);
      await fetch(`${BASE_URL}/api/collections/${existing.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ...col, id: existing.id })
      });
    } else {
      console.log(`🆕 Criando nova coleção: ${col.name}`);
      await fetch(`${BASE_URL}/api/collections`, {
        method: 'POST',
        headers,
        body: JSON.stringify(col)
      });
    }
  }

  console.log("\n🏁 Configuração concluída.");
}

main();

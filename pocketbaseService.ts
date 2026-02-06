export type PocketBaseAuthRecord = {
  id: string;
  email?: string;
  role?: 'admin' | 'user';
  verified?: boolean;
};

type PocketBaseAuthState = {
  token: string;
  record: PocketBaseAuthRecord;
};

const PB_BASE_URL = 'https://centraldedados.duckdns.org';
const PROJECT_PREFIX = 'rastreador_de_vencimentos';

export const PocketBaseCollections = {
  users: `${PROJECT_PREFIX}_usuarios`,
  categories: `${PROJECT_PREFIX}_categorias`,
  bills: `${PROJECT_PREFIX}_contas`,
  auditLogs: `${PROJECT_PREFIX}_audit_logs`
} as const;

const STORAGE_KEY = 'pb_auth_state';

const memoryStorage = (() => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); }
  };
})();

const storage =
  typeof localStorage === 'undefined'
    ? memoryStorage
    : localStorage;

const safeJson = async <T>(resp: Response): Promise<T | null> => {
  try {
    return await resp.json();
  } catch {
    return null;
  }
};

export const PocketBaseService = {
  getBaseUrl() {
    return PB_BASE_URL;
  },

  getAuthState(): PocketBaseAuthState | null {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as PocketBaseAuthState;
      if (!parsed?.token || !parsed?.record?.id) return null;
      return parsed;
    } catch {
      return null;
    }
  },

  setAuthState(next: PocketBaseAuthState) {
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  },

  clearAuthState() {
    storage.removeItem(STORAGE_KEY);
  },

  async authWithPassword(identity: string, password: string): Promise<PocketBaseAuthState> {
    const resp = await fetch(`${PB_BASE_URL}/api/collections/${PocketBaseCollections.users}/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity, password })
    });

    const data = await safeJson<any>(resp);
    if (!resp.ok || !data?.token || !data?.record?.id) {
      const details = data?.message || data?.data || resp.statusText;
      throw new Error(`Falha no login: HTTP ${resp.status} - ${String(details)}`);
    }

    const state: PocketBaseAuthState = { token: data.token, record: data.record };
    this.setAuthState(state);
    return state;
  },

  async authRefresh(token: string): Promise<PocketBaseAuthState> {
    const resp = await fetch(`${PB_BASE_URL}/api/collections/${PocketBaseCollections.users}/auth-refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token }
    });

    const data = await safeJson<any>(resp);
    if (!resp.ok || !data?.token || !data?.record?.id) {
      const details = data?.message || data?.data || resp.statusText;
      throw new Error(`Falha ao atualizar sessão: HTTP ${resp.status} - ${String(details)}`);
    }

    const state: PocketBaseAuthState = { token: data.token, record: data.record };
    this.setAuthState(state);
    return state;
  },

  async createUser(email: string, password: string, passwordConfirm: string): Promise<any> {
    const resp = await fetch(`${PB_BASE_URL}/api/collections/${PocketBaseCollections.users}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        passwordConfirm,
        role: 'user',
        emailVisibility: true
      })
    });

    const data = await safeJson<any>(resp);
    if (!resp.ok || !data?.id) {
      const details = data?.message || data?.data || resp.statusText;
      throw new Error(`Falha ao criar conta: HTTP ${resp.status} - ${String(JSON.stringify(details))}`);
    }

    return data;
  },

  async requestVerification(email: string): Promise<void> {
    const resp = await fetch(`${PB_BASE_URL}/api/collections/${PocketBaseCollections.users}/request-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!resp.ok) {
      const data = await safeJson<any>(resp);
      const details = data?.message || data?.data || resp.statusText;
      throw new Error(`Falha ao solicitar verificação: HTTP ${resp.status} - ${String(JSON.stringify(details))}`);
    }
  },

  async requestPasswordReset(email: string): Promise<void> {
    const resp = await fetch(`${PB_BASE_URL}/api/collections/${PocketBaseCollections.users}/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!resp.ok) {
      const data = await safeJson<any>(resp);
      const details = data?.message || data?.data || resp.statusText;
      throw new Error(`Falha ao solicitar recuperação: HTTP ${resp.status} - ${String(JSON.stringify(details))}`);
    }
  },

  async listRecords<T>(
    token: string,
    collection: string,
    params: Record<string, string | number | undefined>
  ): Promise<{ items: T[]; page: number; perPage: number; totalItems: number; totalPages: number }> {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      search.set(key, String(value));
    }

    const resp = await fetch(`${PB_BASE_URL}/api/collections/${collection}/records?${search.toString()}`, {
      headers: { 'Authorization': token }
    });

    const data = await safeJson<any>(resp);
    if (!resp.ok || !data?.items) {
      const details = data?.message || data?.data || resp.statusText;
      throw new Error(`Falha ao listar ${collection}: HTTP ${resp.status} - ${String(details)}`);
    }

    return data;
  },

  async createRecord<T>(token: string, collection: string, body: Record<string, any>): Promise<T> {
    const resp = await fetch(`${PB_BASE_URL}/api/collections/${collection}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify(body)
    });

    const data = await safeJson<any>(resp);
    if (!resp.ok || !data?.id) {
      const details = data?.message || data?.data || resp.statusText;
      throw new Error(`Falha ao criar em ${collection}: HTTP ${resp.status} - ${String(details)}`);
    }

    return data;
  },

  async updateRecord<T>(token: string, collection: string, id: string, body: Record<string, any>): Promise<T> {
    const resp = await fetch(`${PB_BASE_URL}/api/collections/${collection}/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify(body)
    });

    const data = await safeJson<any>(resp);
    if (!resp.ok || !data?.id) {
      const details = data?.message || data?.data || resp.statusText;
      throw new Error(`Falha ao atualizar ${collection}/${id}: HTTP ${resp.status} - ${String(details)}`);
    }

    return data;
  },

  async deleteRecord(token: string, collection: string, id: string): Promise<void> {
    const resp = await fetch(`${PB_BASE_URL}/api/collections/${collection}/records/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': token }
    });

    if (!resp.ok) {
      const data = await safeJson<any>(resp);
      const details = data?.message || data?.data || resp.statusText;
      throw new Error(`Falha ao excluir ${collection}/${id}: HTTP ${resp.status} - ${String(details)}`);
    }
  }
};

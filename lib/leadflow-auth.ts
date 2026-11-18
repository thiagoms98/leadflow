'use client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  initials: string;
  isDemo?: boolean;
  accessToken?: string;
  refreshToken?: string;
}

interface StoredAccount extends AuthUser {
  password: string;
}

const USERS_KEY = 'leadflow_users_v1';
const SESSION_KEY = 'leadflow_session_v1';

export const DEMO_ACCOUNT: StoredAccount = {
  id: 'tm-thiago',
  name: 'Thiago Mendes',
  email: 'thiago.mendes@leadflow.com.br',
  company: 'LeadFlow Brasil',
  role: 'Diretor Comercial',
  initials: 'TM',
  password: 'leadflow123',
  isDemo: true,
};

const sessionListeners = new Set<() => void>();
let cachedSessionRaw: string | null | undefined = undefined;
let cachedSessionValue: AuthUser | null = null;

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'LF';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getStoredAccounts(): StoredAccount[] {
  if (typeof window === 'undefined') return [DEMO_ACCOUNT];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [DEMO_ACCOUNT];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [DEMO_ACCOUNT];
    return parsed as StoredAccount[];
  } catch {
    return [DEMO_ACCOUNT];
  }
}

function saveStoredAccounts(accounts: StoredAccount[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(accounts));
  } catch {
    // Ignora erro de quota
  }
}

export function getSessionSnapshot(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw === null) {
      cachedSessionRaw = null;
      cachedSessionValue = null;
      return null;
    }
    if (raw !== cachedSessionRaw) {
      cachedSessionRaw = raw;
      cachedSessionValue = JSON.parse(raw) as AuthUser;
    }
    return cachedSessionValue;
  } catch {
    return null;
  }
}

export function getSessionServerSnapshot(): AuthUser | null {
  return null;
}

export function subscribeSession(listener: () => void): () => void {
  sessionListeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === SESSION_KEY) listener();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }
  return () => {
    sessionListeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}

export function setSession(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  if (user === null) {
    cachedSessionRaw = null;
    cachedSessionValue = null;
    window.localStorage.removeItem(SESSION_KEY);
  } else {
    const serialized = JSON.stringify(user);
    cachedSessionRaw = serialized;
    cachedSessionValue = user;
    try {
      window.localStorage.setItem(SESSION_KEY, serialized);
    } catch {
      // Ignora erro de quota
    }
  }
  sessionListeners.forEach((l) => l());
}

async function checkSupabaseServerStatus(): Promise<{
  configured: boolean;
  diagnosticError: string | null;
}> {
  try {
    const res = await fetch('/api/supabase/status', { cache: 'no-store' });
    if (!res.ok) return { configured: false, diagnosticError: null };
    return (await res.json()) as {
      configured: boolean;
      diagnosticError: string | null;
    };
  } catch {
    return { configured: false, diagnosticError: null };
  }
}

export async function refreshSupabaseSession(): Promise<string | null> {
  const current = getSessionSnapshot();
  if (!current || current.isDemo || !current.refreshToken) return null;

  try {
    const res = await fetch('/api/supabase/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'refresh',
        refreshToken: current.refreshToken,
      }),
    });
    if (!res.ok) {
      setSession(null);
      return null;
    }
    const data = (await res.json()) as {
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
    };
    setSession({
      ...data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { ok: false, error: 'Informe um e-mail corporativo válido.' };
  }
  if (password.length < 6) {
    return { ok: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
  }

  const status = await checkSupabaseServerStatus();
  if (status.diagnosticError) {
    return { ok: false, error: status.diagnosticError };
  }

  if (status.configured) {
    const res = await fetch('/api/supabase/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: normalizedEmail,
        password,
      }),
    });
    const data = (await res.json()) as {
      user?: AuthUser;
      accessToken?: string;
      refreshToken?: string;
      error?: string;
    };

    if (!res.ok || !data.user) {
      return {
        ok: false,
        error: data.error || 'Não foi possível autenticar no Supabase.',
      };
    }

    const sessionUser: AuthUser = {
      ...data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
    setSession(sessionUser);
    return { ok: true, user: sessionUser };
  }

  const accounts = getStoredAccounts();
  const match = accounts.find(
    (acc) => acc.email.toLowerCase() === normalizedEmail
  );

  if (!match) {
    return {
      ok: false,
      error:
        'Nenhuma conta encontrada com este e-mail. Crie sua conta ou entre com a conta demonstração.',
    };
  }

  if (match.password !== password) {
    return { ok: false, error: 'Senha incorreta. Tente novamente.' };
  }

  const user: AuthUser = {
    id: match.id,
    name: match.name,
    email: match.email,
    company: match.company,
    role: match.role,
    initials: match.initials,
    isDemo: match.isDemo,
  };
  setSession(user);
  return { ok: true, user };
}

export async function registerAccount(input: {
  name: string;
  email: string;
  company: string;
  role: string;
  password: string;
}): Promise<
  | { ok: true; user: AuthUser | null; needsConfirmation?: boolean }
  | { ok: false; error: string }
> {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (!input.name.trim()) {
    return { ok: false, error: 'Informe seu nome completo.' };
  }
  if (!input.company.trim()) {
    return { ok: false, error: 'Informe o nome da sua empresa.' };
  }
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { ok: false, error: 'Informe um e-mail corporativo válido.' };
  }
  if (input.password.length < 6) {
    return { ok: false, error: 'A senha deve conter no mínimo 6 caracteres.' };
  }

  const status = await checkSupabaseServerStatus();
  if (status.diagnosticError) {
    return { ok: false, error: status.diagnosticError };
  }

  if (status.configured) {
    const res = await fetch('/api/supabase/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'register',
        name: input.name.trim(),
        company: input.company.trim(),
        role: input.role.trim() || 'Gestor Comercial',
        email: normalizedEmail,
        password: input.password,
      }),
    });

    const data = (await res.json()) as {
      user?: AuthUser | null;
      accessToken?: string;
      refreshToken?: string;
      needsConfirmation?: boolean;
      error?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        error: data.error || 'Erro ao criar conta no Supabase.',
      };
    }

    if (data.needsConfirmation || !data.user) {
      return { ok: true, user: null, needsConfirmation: true };
    }

    const sessionUser: AuthUser = {
      ...data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
    setSession(sessionUser);
    return { ok: true, user: sessionUser, needsConfirmation: false };
  }

  const accounts = getStoredAccounts();
  if (accounts.some((acc) => acc.email.toLowerCase() === normalizedEmail)) {
    return {
      ok: false,
      error: 'Este e-mail já está cadastrado. Faça login para acessar.',
    };
  }

  const newAccount: StoredAccount = {
    id: `usr-${Date.now()}`,
    name: input.name.trim(),
    email: normalizedEmail,
    company: input.company.trim(),
    role: input.role.trim() || 'Gestor Comercial',
    initials: computeInitials(input.name),
    password: input.password,
  };

  saveStoredAccounts([...accounts, newAccount]);

  const user: AuthUser = {
    id: newAccount.id,
    name: newAccount.name,
    email: newAccount.email,
    company: newAccount.company,
    role: newAccount.role,
    initials: newAccount.initials,
  };
  setSession(user);
  return { ok: true, user, needsConfirmation: false };
}

export async function resetPassword(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    return { ok: false, error: 'Informe um e-mail válido para recuperação.' };
  }

  const status = await checkSupabaseServerStatus();
  if (status.configured) {
    const res = await fetch('/api/supabase/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'recover', email: normalized }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      return {
        ok: false,
        error: data.error || 'Não foi possível enviar o e-mail de recuperação.',
      };
    }
  }
  return { ok: true };
}

export function loginAsDemo(): AuthUser {
  const user: AuthUser = {
    id: DEMO_ACCOUNT.id,
    name: DEMO_ACCOUNT.name,
    email: DEMO_ACCOUNT.email,
    company: DEMO_ACCOUNT.company,
    role: DEMO_ACCOUNT.role,
    initials: DEMO_ACCOUNT.initials,
    isDemo: true,
  };
  setSession(user);
  return user;
}

export async function logoutSession() {
  setSession(null);
}

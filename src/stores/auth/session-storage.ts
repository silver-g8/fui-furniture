import type { AuthSession, TokenSource } from '@/types/auth';

export const AUTH_SESSION_KEY = 'roiet-auth-session';
export const REMEMBER_FLAG_KEY = 'roiet-auth-remember';

const DEFAULT_SESSION: AuthSession = {
  token: null,
  tokenType: null,
  expiresAt: null,
  user: null,
  rememberMe: false,
  tokenSource: null,
};

let memorySession: AuthSession = { ...DEFAULT_SESSION };

const isBrowser = () => typeof window !== 'undefined';

const readFromStorage = (storage: Storage): Partial<AuthSession> | null => {
  try {
    const raw = storage.getItem(AUTH_SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    return {
      token: parsed.token ?? null,
      tokenType: parsed.tokenType ?? null,
      expiresAt: parsed.expiresAt ?? null,
      user: parsed.user ?? null,
    };
  } catch {
    return null;
  }
};

export const getMemorySession = (): AuthSession => memorySession;

export const hydrateSession = (): AuthSession => {
  if (!isBrowser()) {
    memorySession = { ...DEFAULT_SESSION };
    return memorySession;
  }

  const preferLocal = window.localStorage.getItem(REMEMBER_FLAG_KEY) === 'true';
  const storages: Array<{ storage: Storage; source: TokenSource }> = preferLocal
    ? [
        { storage: window.localStorage, source: 'local' },
        { storage: window.sessionStorage, source: 'session' },
      ]
    : [
        { storage: window.sessionStorage, source: 'session' },
        { storage: window.localStorage, source: 'local' },
      ];

  for (const { storage, source } of storages) {
    const session = readFromStorage(storage);
    if (session && session.token) {
      memorySession = {
        ...DEFAULT_SESSION,
        ...session,
        rememberMe: source === 'local' ? true : preferLocal,
        tokenSource: source,
      };
      return memorySession;
    }
  }

  memorySession = { ...DEFAULT_SESSION, rememberMe: preferLocal };
  return memorySession;
};

export const persistSession = (session: AuthSession): void => {
  memorySession = { ...session, tokenSource: 'memory' };

  if (!isBrowser()) {
    return;
  }

  const storage = session.rememberMe ? window.localStorage : window.sessionStorage;
  const fallback = session.rememberMe ? window.sessionStorage : window.localStorage;

  const payload = JSON.stringify({
    token: session.token,
    tokenType: session.tokenType,
    expiresAt: session.expiresAt,
    user: session.user,
  });

  try {
    storage.setItem(AUTH_SESSION_KEY, payload);
    fallback.removeItem(AUTH_SESSION_KEY);
    window.localStorage.setItem(REMEMBER_FLAG_KEY, session.rememberMe ? 'true' : 'false');
  } catch {
    // ignore quota or private mode errors
  }
};

export const clearPersistedSession = (): void => {
  memorySession = { ...DEFAULT_SESSION };

  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    window.sessionStorage.removeItem(AUTH_SESSION_KEY);
    window.localStorage.removeItem(REMEMBER_FLAG_KEY);
  } catch {
    // ignore
  }
};

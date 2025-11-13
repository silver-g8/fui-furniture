import { defineStore } from 'pinia';
import {
  login as loginApi,
  fetchMe as fetchMeApi,
  logout as logoutApi,
  type LogoutRequest,
} from '@/services/auth/api';
import type {
  AuthError,
  AuthSession,
  AuthUser,
  LoginPayload,
  TokenSource,
} from '@/types/auth';
import { hydrateSession, persistSession, clearPersistedSession } from './session-storage';

export type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'error';

interface AuthState {
  token: string | null;
  tokenType: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  error: AuthError | null;
  expiresAt: string | null;
  rememberMe: boolean;
  tokenSource: TokenSource;
}

const DEFAULT_SESSION: AuthSession = {
  token: null,
  tokenType: null,
  expiresAt: null,
  user: null,
  rememberMe: false,
  tokenSource: null,
};

const toAuthError = (error: unknown, fallback = 'Unexpected error'): AuthError => {
  if (error && typeof error === 'object') {
    const candidate = error as Record<string, unknown>;
    const message =
      typeof candidate.message === 'string' && candidate.message.length > 0
        ? candidate.message
        : fallback;

    const authError: AuthError = { message };

    if (typeof candidate.code === 'string') {
      authError.code = candidate.code;
    }

    if (typeof candidate.traceId === 'string') {
      authError.traceId = candidate.traceId;
    }

    if (candidate.errors && typeof candidate.errors === 'object') {
      authError.fields = candidate.errors as Record<string, string[]>;
    }

    return authError;
  }

  if (error instanceof Error && error.message) {
    return { message: error.message };
  }

  return { message: fallback };
};

const applySessionToState = (state: AuthState, session: AuthSession, status: AuthStatus) => {
  state.token = session.token;
  state.tokenType = session.tokenType;
  state.user = session.user;
  state.expiresAt = session.expiresAt;
  state.rememberMe = session.rememberMe;
  state.tokenSource = session.tokenSource;
  state.status = status;
};

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    tokenType: null,
    user: null,
    status: 'idle',
    error: null,
    expiresAt: null,
    rememberMe: false,
    tokenSource: null,
  }),
  getters: {
    isAuthenticated: (state) => state.status === 'authenticated' && !!state.token,
    errorMessage: (state) => state.error?.message ?? null,
  },
  actions: {
    hydrateFromStorage(): void {
      const session = hydrateSession();
      applySessionToState(this, session, session.token ? 'authenticated' : 'idle');
      this.error = null;
    },

    async login(payload: LoginPayload): Promise<void> {
      this.status = 'authenticating';
      this.error = null;

      try {
        const response = await loginApi(payload);
        const rememberMe = payload.remember ?? this.rememberMe ?? false;
        const expiresAt = response.expiresIn
          ? new Date(Date.now() + response.expiresIn * 1000).toISOString()
          : null;

        const session: AuthSession = {
          token: response.token,
          tokenType: response.tokenType,
          expiresAt,
          user: response.user,
          rememberMe,
          tokenSource: 'memory',
        };

        applySessionToState(this, session, 'authenticated');
        this.error = null;
        persistSession(session);
      } catch (error) {
        this.status = 'error';
        this.error = toAuthError(error, 'Login failed');
        throw error;
      }
    },

    async fetchMe(): Promise<void> {
      if (!this.token) {
        return;
      }

      try {
        const response = await fetchMeApi();
        const session: AuthSession = {
          token: this.token,
          tokenType: this.tokenType,
          expiresAt: this.expiresAt,
          user: response.user,
          rememberMe: this.rememberMe,
          tokenSource: this.tokenSource,
        };

        applySessionToState(this, session, 'authenticated');
        this.error = null;
        persistSession(session);
      } catch (error) {
        this.status = 'error';
        this.error = toAuthError(error, 'à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¹‚à¸«à¸¥à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¹„à¸”à¹‰');
        throw error;
      }
    },

    async logout(options: LogoutRequest = {}): Promise<void> {
      try {
        await logoutApi(options);
      } finally {
        this.clearSession();
      }
    },

    clearSession(): void {
      applySessionToState(this, DEFAULT_SESSION, 'idle');
      this.error = null;
      clearPersistedSession();
    },

    setRememberMe(value: boolean): void {
      this.rememberMe = value;
      if (!this.token) {
        persistSession({
          ...DEFAULT_SESSION,
          rememberMe: value,
          tokenSource: value ? 'local' : 'session',
        });
      }
    },

    clearError(): void {
      this.error = null;
    },
  },
});

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

const toAuthError = (error: unknown, fallbackKey = 'auth.errors.unexpected'): AuthError => {
  // Default Thai error messages
  const defaultMessages: Record<string, string> = {
    'auth.errors.loginFailed': 'ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบข้อมูลอีกครั้ง',
    'auth.errors.unauthorized': 'กรุณาเข้าสู่ระบบใหม่',
    'auth.errors.fetchUserFailed': 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้',
    'auth.errors.unexpected': 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
    'auth.errors.networkError': 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
    'auth.errors.requestFailed': 'คำขอล้มเหลว',
  };
  const fallback: string = defaultMessages[fallbackKey] || defaultMessages['auth.errors.unexpected'] || 'เกิดข้อผิดพลาดที่ไม่คาดคิด';

  if (error && typeof error === 'object') {
    const candidate = error as Record<string, unknown>;
    let message =
      typeof candidate.message === 'string' && candidate.message.length > 0
        ? candidate.message
        : fallback;
    
    // Check if message is garbled Thai (contains à¸ pattern) and replace with proper Thai
    if (typeof message === 'string' && (message.includes('à¸') || message.includes('à¹'))) {
      // Map common garbled messages to proper Thai
      if (message.includes('à¸­à¸µà¹€à¸¡à¸¥à¸«à¸£à¸·à¸­à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹„à¸¡à¹ˆà¸–à¸¹à¸\x81à¸•à¹‰à¸à¸‡')) {
        message = 'ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบข้อมูลอีกครั้ง';
      } else {
        message = fallback;
      }
    }

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
        this.error = toAuthError(error, 'auth.errors.loginFailed');
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
        this.error = toAuthError(error, 'auth.errors.fetchUserFailed');
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

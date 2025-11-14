import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosInstance } from 'axios';
import { useAuthStore } from '@/stores/auth/useAuthStore';
import {
  clearPersistedSession,
  getMemorySession,
  hydrateSession,
} from '@/stores/auth/session-storage';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

const normalizeBaseUrl = (value: string | undefined | null): string => {
  if (!value) {
    return '/api/v1';
  }

  const trimmed = value.trim();
  if (!trimmed.length) {
    return '/api/v1';
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
  }

  return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`;
};

export const apiBaseURL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
const UNAUTHORIZED_EVENT = 'app:unauthorized';

export interface ApiErrorPayload {
  message: string;
  status?: number;
  code?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
  raw?: unknown;
}

const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});

api.defaults.withCredentials = true;
api.defaults.xsrfCookieName = 'XSRF-TOKEN';
api.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';
api.defaults.headers.common = api.defaults.headers.common ?? {};
api.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const normalizeAxiosError = (error: unknown): ApiErrorPayload => {
  if (axios.isAxiosError(error)) {
    const response = error.response;

    if (response) {
      const data = (response.data ?? {}) as Record<string, unknown>;
      const payload: ApiErrorPayload = {
        message: (data.message as string) || error.message || 'Request failed',
        status: response.status,
        raw: error,
      };

      if (typeof data.code === 'string') {
        payload.code = data.code;
      }

      const validationErrors = data.errors;
      if (validationErrors && typeof validationErrors === 'object') {
        payload.errors = validationErrors as Record<string, string[]>;
      }

      if (typeof data.trace_id === 'string') {
        payload.traceId = data.trace_id;
      }

      return payload;
    }

    const payload: ApiErrorPayload = {
      message: error.message || 'Network error',
      raw: error,
    };

    if (typeof error.response?.status === 'number') {
      payload.status = error.response.status;
    }

    return payload;
  }

  if (error instanceof Error) {
    return {
      message: error.message || 'Unexpected error',
      raw: error,
    };
  }

  return {
    message: 'Unexpected error',
    raw: error,
  };
};

const toError = (payload: ApiErrorPayload) => Object.assign(new Error(payload.message), payload);

const readTokenFromStores = (): string | null => {
  const memorySession = getMemorySession();
  if (memorySession.token) {
    return memorySession.token;
  }

  const hydrated = hydrateSession();
  return hydrated.token;
};

api.interceptors.request.use(
  (config) => {
    try {
      const authStore = useAuthStore();
      const token = authStore.token || readTokenFromStores();
      if (token) {
        config.headers = config.headers ?? {};
        if (!config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // ignore token lookup errors
    }

    // ตรวจสอบและส่ง CSRF token จาก cookie
    if (typeof document !== 'undefined') {
      const csrfCookie = document.cookie.split('; ').find((row) => row.startsWith('XSRF-TOKEN='));
      const csrfToken = csrfCookie ? csrfCookie.split('=')[1] : null;

      if (csrfToken) {
        // ส่ง CSRF token เป็น header เอง เพราะ Axios อาจจะไม่สามารถอ่าน cookie จาก domain อื่นได้
        config.headers = config.headers ?? {};
        if (!config.headers['X-XSRF-TOKEN']) {
          config.headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken);
        }
      }
    }

    return config;
  },
  (error) => {
    const normalized = normalizeAxiosError(error);
    return Promise.reject(toError(normalized));
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeAxiosError(error);

    if (normalized.status === 401 && typeof window !== 'undefined') {
      try {
        const authStore = useAuthStore();
        authStore.clearSession();
      } catch {
        clearPersistedSession();
      }

      window.dispatchEvent(
        new CustomEvent<ApiErrorPayload>(UNAUTHORIZED_EVENT, { detail: normalized }),
      );
    }

    return Promise.reject(toError(normalized));
  },
);

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api, UNAUTHORIZED_EVENT, normalizeAxiosError, toError };

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
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
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
      // Handle error message - check if it's garbled Thai text and replace with proper Thai message
      let errorMessage = (data.message as string) || error.message || 'คำขอล้มเหลว';
      
      // Check if message is garbled Thai (contains à¸ pattern)
      if (errorMessage.includes('à¸') || errorMessage.includes('à¹')) {
        // Map common garbled messages to proper Thai
        if (errorMessage.includes('à¸­à¸µà¹€à¸¡à¸¥à¸«à¸£à¸·à¸­à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹„à¸¡à¹ˆà¸–à¸¹à¸\x81à¸•à¹‰à¸à¸‡')) {
          errorMessage = 'ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบข้อมูลอีกครั้ง';
        } else if (response.status === 401) {
          errorMessage = 'กรุณาเข้าสู่ระบบใหม่';
        } else {
          errorMessage = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
        }
      }
      
      const payload: ApiErrorPayload = {
        message: errorMessage,
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
      message: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      raw: error,
    };

    if (typeof error.response?.status === 'number') {
      payload.status = error.response.status;
    }

    return payload;
  }

  if (error instanceof Error) {
    // Check if error message is garbled Thai
    let errorMessage = error.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
    if (errorMessage.includes('à¸') || errorMessage.includes('à¹')) {
      errorMessage = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
    }
    return {
      message: errorMessage,
      raw: error,
    };
  }

  return {
    message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
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
  async (config) => {
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
    // สำหรับ POST, PUT, PATCH, DELETE requests ที่ต้องการ CSRF protection
    if (typeof document !== 'undefined' && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      // ข้าม CSRF token สำหรับ CSRF cookie endpoint
      if (config.url && config.url.includes('/sanctum/csrf-cookie')) {
        return config;
      }

      // สร้าง base URL สำหรับ CSRF cookie endpoint
      let csrfBaseURL = apiBaseURL.replace('/api/v1', '');
      if (!csrfBaseURL || csrfBaseURL === apiBaseURL || !csrfBaseURL.startsWith('http')) {
        // ถ้า apiBaseURL ไม่ใช่ full URL ให้ใช้ window.location.origin
        csrfBaseURL = typeof window !== 'undefined' ? window.location.origin : '';
      }

      // Refresh CSRF token ก่อนทุก POST/PUT/PATCH/DELETE request เพื่อให้แน่ใจว่า token ยังใช้งานได้
      let csrfToken = null;
      try {
        // Refresh CSRF token
        await axios.get('/sanctum/csrf-cookie', {
          withCredentials: true,
          baseURL: csrfBaseURL,
        });
        
        // รอสักครู่เพื่อให้ cookie ถูก set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // อ่าน CSRF token ใหม่
        const csrfCookie = document.cookie.split('; ').find((row) => row.startsWith('XSRF-TOKEN='));
        csrfToken = csrfCookie ? csrfCookie.split('=')[1] : null;
        
        if (!csrfToken) {
          console.warn('CSRF token not found after refresh for', config.method?.toUpperCase(), config.url);
        }
      } catch (error) {
        console.warn('Failed to refresh CSRF token:', error);
        // ลองอ่าน CSRF token จาก cookie ที่มีอยู่
        const csrfCookie = document.cookie.split('; ').find((row) => row.startsWith('XSRF-TOKEN='));
        csrfToken = csrfCookie ? csrfCookie.split('=')[1] : null;
      }

      if (csrfToken) {
        // ส่ง CSRF token เป็น header
        config.headers = config.headers ?? {};
        if (!config.headers['X-XSRF-TOKEN']) {
          // decodeURIComponent เพื่อแปลง URL-encoded token
          try {
            const decodedToken = decodeURIComponent(csrfToken);
            config.headers['X-XSRF-TOKEN'] = decodedToken;
            // Debug: log CSRF token (first 50 chars only)
            console.debug('CSRF token set for', config.method?.toUpperCase(), config.url, decodedToken.substring(0, 50) + '...');
          } catch (error) {
            console.error('Failed to decode CSRF token:', error);
            // ถ้า decode ไม่ได้ ให้ใช้ token เดิม
            config.headers['X-XSRF-TOKEN'] = csrfToken;
          }
        }
      } else {
        console.warn('CSRF token not found for', config.method?.toUpperCase(), config.url);
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

    // สำหรับ 403 (Forbidden) ไม่ต้อง log error ใน console ถ้าเป็น permission issue
    // แต่ยังคง reject promise เพื่อให้ component จัดการ error ได้
    if (normalized.status === 403) {
      // ไม่ log error ใน console เพื่อลด noise
      // Component สามารถจัดการ error นี้ได้เองผ่าน try-catch
    }

    return Promise.reject(toError(normalized));
  },
);

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api, UNAUTHORIZED_EVENT, normalizeAxiosError, toError };

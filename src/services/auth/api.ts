import axios from 'axios';
import { api, apiBaseURL } from '@/boot/axios';
import type { AuthUser, LoginPayload, LoginResponse, MeResponse } from '@/types/auth';

interface ApiEnvelope<T> {
  data: T;
  message: string;
}

interface UserSummaryDto {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions?: string[] | null;
  avatar_url?: string | null;
  last_login_at?: string | null;
}

interface LoginResponseDto {
  token: string;
  tokenType: string;
  expiresIn: number | null;
  user: UserSummaryDto;
}

interface MeResponseDto {
  user: UserSummaryDto;
}

const AUTH_PREFIX = '/auth';
const CSRF_COOKIE_ENDPOINT = import.meta.env.VITE_CSRF_COOKIE_URL?.trim() || '/sanctum/csrf-cookie';

let csrfCookieFetched = false;

const buildCsrfCookieUrl = (): string => {
  // ถ้า CSRF_COOKIE_ENDPOINT เป็น full URL ให้ใช้เลย
  if (/^https?:\/\//i.test(CSRF_COOKIE_ENDPOINT)) {
    return CSRF_COOKIE_ENDPOINT;
  }

  // วิธีที่ 1: ใช้ VITE_BACKEND_URL ถ้ามี (แนะนำสำหรับ production)
  const backendUrl = import.meta.env.VITE_BACKEND_URL?.trim();
  if (backendUrl && /^https?:\/\//i.test(backendUrl)) {
    try {
      const backendOrigin = new URL(backendUrl).origin;
      return `${backendOrigin}${CSRF_COOKIE_ENDPOINT.startsWith('/') ? '' : '/'}${CSRF_COOKIE_ENDPOINT}`;
    } catch (error) {
      console.warn('[Auth] Failed to parse VITE_BACKEND_URL:', backendUrl, error);
    }
  }

  // วิธีที่ 2: ใช้ apiBaseURL ถ้าเป็น full URL
  if (/^https?:\/\//i.test(apiBaseURL)) {
    try {
      const apiUrl = new URL(apiBaseURL);
      // ลบ /api/v1 ออกเพื่อได้ base origin
      const basePath = apiUrl.pathname.replace(/\/api\/v1\/?$/, '');
      const origin = apiUrl.origin;
      return `${origin}${basePath}${CSRF_COOKIE_ENDPOINT.startsWith('/') ? '' : '/'}${CSRF_COOKIE_ENDPOINT}`;
    } catch (error) {
      console.warn('[Auth] Failed to parse apiBaseURL:', apiBaseURL, error);
    }
  }

  // ⚠️ Fallback: ถ้า apiBaseURL ไม่ใช่ full URL
  // ใน production ควรตั้งค่า VITE_BACKEND_URL หรือ VITE_API_BASE_URL เป็น full URL
  if (typeof window !== 'undefined' && window.location?.origin) {
    // ใน development mode ใช้ proxy ดังนั้น relative path เป็นเรื่องปกติ
    // แสดง error เฉพาะใน production mode
    const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    
    if (!isDevelopment) {
      console.error(
        '[Auth] ⚠️ CRITICAL: apiBaseURL is not a full URL and VITE_BACKEND_URL is not set!',
        '\n  CSRF cookie will use Frontend origin (WRONG in production):',
        window.location.origin,
        '\n  Please set one of these in .env.production:',
        '\n    - VITE_BACKEND_URL=https://imageapi.sg8net.com',
        '\n    - OR VITE_API_BASE_URL=https://imageapi.sg8net.com/api/v1',
        '\n  Current apiBaseURL:',
        apiBaseURL,
      );
    }

    // ⚠️ ใช้ Frontend origin (ผิดใน production แต่จำเป็นสำหรับ fallback)
    // ใน development mode ใช้ proxy ดังนั้น relative path เป็นเรื่องปกติ
    return `${window.location.origin}${
      CSRF_COOKIE_ENDPOINT.startsWith('/') ? '' : '/'
    }${CSRF_COOKIE_ENDPOINT}`;
  }

  // Last resort fallback
  return CSRF_COOKIE_ENDPOINT;
};

const ensureCsrfCookie = async () => {
  if (csrfCookieFetched) {
    return;
  }

  const url = buildCsrfCookieUrl();

  try {
    await axios.get(url, {
      withCredentials: true,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    
    csrfCookieFetched = true;
  } catch (error) {
    csrfCookieFetched = false;
    throw error;
  }
};

const mapUser = (dto: UserSummaryDto): AuthUser => ({
  id: dto.id,
  name: dto.name,
  email: dto.email,
  roles: dto.roles ?? [],
  permissions: dto.permissions ?? [],
  avatarUrl: dto.avatar_url ?? null,
  lastLoginAt: dto.last_login_at ?? null,
});

const mapLoginResponse = (dto: LoginResponseDto): LoginResponse => ({
  token: dto.token,
  tokenType: dto.tokenType,
  expiresIn: dto.expiresIn ?? null,
  user: mapUser(dto.user),
});

const mapMeResponse = (dto: MeResponseDto): MeResponse => ({
  user: mapUser(dto.user),
});

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  await ensureCsrfCookie();

  const body: LoginPayload = {
    ...payload,
    remember: payload.remember ?? false,
  };
  const { data } = await api.post<ApiEnvelope<LoginResponseDto>>(`${AUTH_PREFIX}/login`, body);

  return mapLoginResponse(data.data);
};

export const fetchMe = async (): Promise<MeResponse> => {
  const { data } = await api.get<ApiEnvelope<MeResponseDto>>(`${AUTH_PREFIX}/me`);

  return mapMeResponse(data.data);
};

export interface LogoutRequest {
  all?: boolean;
}

export const logout = async (payload: LogoutRequest = {}): Promise<void> => {
  await api.post<ApiEnvelope<null>>(`${AUTH_PREFIX}/logout`, payload);
};

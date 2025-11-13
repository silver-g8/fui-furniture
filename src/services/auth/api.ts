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
const CSRF_COOKIE_ENDPOINT =
  import.meta.env.VITE_CSRF_COOKIE_URL?.trim() || '/sanctum/csrf-cookie';

let csrfCookieFetched = false;

const buildCsrfCookieUrl = (): string => {
  if (/^https?:\/\//i.test(CSRF_COOKIE_ENDPOINT)) {
    return CSRF_COOKIE_ENDPOINT;
  }

  if (/^https?:\/\//i.test(apiBaseURL)) {
    try {
      const { origin } = new URL(apiBaseURL);
      return `${origin}${CSRF_COOKIE_ENDPOINT.startsWith('/') ? '' : '/'}${CSRF_COOKIE_ENDPOINT}`;
    } catch {
      // ถ้า parsing ไม่สำเร็จ ให้ตกไปใช้ origin ของหน้าปัจจุบัน
    }
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${
      CSRF_COOKIE_ENDPOINT.startsWith('/') ? '' : '/'
    }${CSRF_COOKIE_ENDPOINT}`;
  }

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

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions?: string[];
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number | null;
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

export type TokenSource = 'memory' | 'session' | 'local' | null;

export interface AuthSession {
  token: string | null;
  tokenType: string | null;
  expiresAt: string | null;
  user: AuthUser | null;
  rememberMe: boolean;
  tokenSource: TokenSource;
}

export interface AuthError {
  message: string;
  code?: string;
  fields?: Record<string, string[]>;
  traceId?: string;
}

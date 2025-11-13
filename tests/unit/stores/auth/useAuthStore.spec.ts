import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/stores/auth/useAuthStore';
import {
  AUTH_SESSION_KEY,
  REMEMBER_FLAG_KEY,
} from '@/stores/auth/session-storage';

const loginMock = vi.fn();
const fetchMeMock = vi.fn();
const logoutMock = vi.fn();

vi.mock('@/services/auth/api', () => ({
  login: (...args: unknown[]) => loginMock(...args),
  fetchMe: (...args: unknown[]) => fetchMeMock(...args),
  logout: (...args: unknown[]) => logoutMock(...args),
}));

describe('useAuthStore - auth flow', () => {
  const localStorageMock = {
    getItem: vi.fn<(key: string) => string | null>(),
    setItem: vi.fn<(key: string, value: string) => void>(),
    removeItem: vi.fn<(key: string) => void>(),
  };

  const sessionStorageMock = {
    getItem: vi.fn<(key: string) => string | null>(),
    setItem: vi.fn<(key: string, value: string) => void>(),
    removeItem: vi.fn<(key: string) => void>(),
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    loginMock.mockReset();
    fetchMeMock.mockReset();
    logoutMock.mockReset();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
    localStorageMock.removeItem.mockReset();
    sessionStorageMock.getItem.mockReset();
    sessionStorageMock.setItem.mockReset();
    sessionStorageMock.removeItem.mockReset();
    vi.stubGlobal('localStorage', localStorageMock as unknown as Storage);
    vi.stubGlobal('sessionStorage', sessionStorageMock as unknown as Storage);
  });

  it('persists session in sessionStorage by default after login success', async () => {
    const store = useAuthStore();

    loginMock.mockResolvedValueOnce({
      token: '1|token',
      tokenType: 'Bearer',
      expiresIn: 7200,
      user: {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        roles: ['admin'],
      },
    });

    await store.login({ email: 'admin@example.com', password: 'secret123' });

    expect(loginMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@example.com',
        password: 'secret123',
      }),
    );
    expect(store.status).toBe('authenticated');
    expect(store.token).toBe('1|token');
    expect(store.rememberMe).toBe(false);
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      AUTH_SESSION_KEY,
      expect.any(String),
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(REMEMBER_FLAG_KEY, 'false');
  });

  it('persists session to localStorage when remember me is true', async () => {
    const store = useAuthStore();

    loginMock.mockResolvedValueOnce({
      token: '1|token',
      tokenType: 'Bearer',
      expiresIn: 7200,
      user: {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        roles: ['admin'],
      },
    });

    await store.login({ email: 'admin@example.com', password: 'secret123', remember: true });

    expect(store.rememberMe).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      AUTH_SESSION_KEY,
      expect.any(String),
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(REMEMBER_FLAG_KEY, 'true');
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(AUTH_SESSION_KEY);
  });

  it('sets error state when login fails', async () => {
    const store = useAuthStore();
    const error = new Error('Invalid credentials');
    loginMock.mockRejectedValueOnce(error);

    await expect(store.login({ email: 'fail@example.com', password: 'wrong' }))
      .rejects.toThrow('Invalid credentials');

    expect(store.status).toBe('error');
    expect(store.error?.message).toBe('Invalid credentials');
    expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('hydrateFromStorage loads remembered session from localStorage', () => {
    const store = useAuthStore();

    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === REMEMBER_FLAG_KEY) {
        return 'true';
      }
      if (key === AUTH_SESSION_KEY) {
        return JSON.stringify({
          token: 'stored-token',
          tokenType: 'Bearer',
          expiresAt: '2025-01-01T00:00:00.000Z',
          user: {
            id: 99,
            name: 'Stored User',
            email: 'stored@example.com',
            roles: ['admin'],
          },
        });
      }
      return null;
    });

    store.hydrateFromStorage();

    expect(store.token).toBe('stored-token');
    expect(store.user?.email).toBe('stored@example.com');
    expect(store.rememberMe).toBe(true);
    expect(store.status).toBe('authenticated');
  });

  it('fetchMe updates user information and persists session', async () => {
    const store = useAuthStore();
    store.hydrateFromStorage();
    store.token = 'existing-token';
    store.tokenType = 'Bearer';
    store.rememberMe = false;

    fetchMeMock.mockResolvedValueOnce({
      user: {
        id: 1,
        name: 'Latest User',
        email: 'latest@example.com',
        roles: ['admin'],
      },
    });

    await store.fetchMe();

    expect(fetchMeMock).toHaveBeenCalledTimes(1);
    expect(store.user?.email).toBe('latest@example.com');
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      AUTH_SESSION_KEY,
      expect.any(String),
    );
  });

  it('logout clears session storage and state', async () => {
    const store = useAuthStore();
    store.token = 'existing-token';
    store.user = {
      id: 1,
      name: 'Demo User',
      email: 'demo@example.com',
      roles: ['admin'],
    };
    store.status = 'authenticated';
    store.rememberMe = true;

    await store.logout();

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(store.token).toBeNull();
    expect(store.user).toBeNull();
    expect(store.status).toBe('idle');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(AUTH_SESSION_KEY);
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(AUTH_SESSION_KEY);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(REMEMBER_FLAG_KEY);
  });
});

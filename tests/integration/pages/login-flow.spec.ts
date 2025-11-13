import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import routes from '@/router/routes';
import { useAuthStore } from '@/stores/auth/useAuthStore';
import {
  AUTH_SESSION_KEY,
  REMEMBER_FLAG_KEY,
} from '@/stores/auth/session-storage';
import { UNAUTHORIZED_EVENT } from '@/boot/axios';

const loginMock = vi.fn();
const fetchMeMock = vi.fn();
const logoutMock = vi.fn();

vi.mock('@/services/auth/api', () => ({
  login: (...args: unknown[]) => loginMock(...args),
  fetchMe: (...args: unknown[]) => fetchMeMock(...args),
  logout: (...args: unknown[]) => logoutMock(...args),
}));

const createStorages = () => {
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

  vi.stubGlobal('localStorage', localStorageMock as unknown as Storage);
  vi.stubGlobal('sessionStorage', sessionStorageMock as unknown as Storage);

  return { localStorageMock, sessionStorageMock };
};

const createTestRouter = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  });

  await router.push('/auth/login');
  await router.isReady();

  return router;
};

describe('authentication flows', () => {
  beforeEach(() => {
    loginMock.mockReset();
    fetchMeMock.mockReset();
    logoutMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('logs in successfully and stores session data', async () => {
    const { localStorageMock, sessionStorageMock } = createStorages();
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = await createTestRouter();
    const authStore = useAuthStore();

    loginMock.mockResolvedValueOnce({
      token: 'token-123',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        roles: ['admin'],
      },
    });
    fetchMeMock.mockResolvedValueOnce({
      user: {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        roles: ['admin'],
      },
    });

    await authStore.login({ email: 'admin@example.com', password: 'secret123' });

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      AUTH_SESSION_KEY,
      expect.any(String),
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(REMEMBER_FLAG_KEY, 'false');

    await router.push('/dashboard');
    await flushPromises();
    expect(router.currentRoute.value.name).toBe('dashboard');
  });

  it('clears session data on logout', async () => {
    const { localStorageMock, sessionStorageMock } = createStorages();
    const pinia = createPinia();
    setActivePinia(pinia);
    await createTestRouter();
    const authStore = useAuthStore();

    loginMock.mockResolvedValueOnce({
      token: 'token-logout',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: 2,
        name: 'Logout User',
        email: 'logout@example.com',
        roles: ['admin'],
      },
    });

    await authStore.login({
      email: 'logout@example.com',
      password: 'secret123',
      remember: true,
    });

    logoutMock.mockResolvedValueOnce(undefined);
    await authStore.logout();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith(AUTH_SESSION_KEY);
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(AUTH_SESSION_KEY);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(REMEMBER_FLAG_KEY);
    expect(authStore.isAuthenticated).toBe(false);
  });

  it('hydrates persisted session and reacts to unauthorized events', async () => {
    const { localStorageMock, sessionStorageMock } = createStorages();
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === REMEMBER_FLAG_KEY) {
        return 'true';
      }
      if (key === AUTH_SESSION_KEY) {
        return JSON.stringify({
          token: 'persisted-token',
          tokenType: 'Bearer',
          expiresAt: '2025-12-31T00:00:00.000Z',
          user: {
            id: 3,
            name: 'Persisted User',
            email: 'persisted@example.com',
            roles: ['admin'],
          },
        });
      }
      return null;
    });

    const pinia = createPinia();
    setActivePinia(pinia);
    await createTestRouter();
    const authStore = useAuthStore();

    authStore.hydrateFromStorage();
    expect(authStore.user?.email).toBe('persisted@example.com');

    authStore.clearSession();
    expect(authStore.isAuthenticated).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(AUTH_SESSION_KEY);
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(AUTH_SESSION_KEY);
  });
});

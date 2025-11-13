import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import routes from '@/router/routes';
import { useAuthStore } from '@/stores/auth/useAuthStore';
import { AUTH_SESSION_KEY, REMEMBER_FLAG_KEY } from '@/stores/auth/session-storage';
import { RouteRecordRaw } from 'vue-router';

const createTestRouter = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  });

  await router.push('/auth/login');
  await router.isReady();

  return router;
};

const loginMock = vi.fn();
const fetchMeMock = vi.fn();
const logoutMock = vi.fn();

vi.mock('@/services/auth/api', () => ({
  login: (...args: unknown[]) => loginMock(...args),
  fetchMe: (...args: unknown[]) => fetchMeMock(...args),
  logout: (...args: unknown[]) => logoutMock(...args),
}));

const findRouteByName = (records: RouteRecordRaw[], name: string): RouteRecordRaw | undefined => {
  for (const record of records) {
    if (record.name === name) {
      return record;
    }
    if (record.children?.length) {
      const found = findRouteByName(record.children, name);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
};

describe('auth guard helpers', () => {
  beforeEach(() => {
    loginMock.mockReset();
    fetchMeMock.mockReset();
    logoutMock.mockReset();
    vi.unstubAllGlobals();
    setActivePinia(createPinia());
  });

  it('hydrates session from storage using hydrateFromStorage', () => {
    const localStorageMock = {
      getItem: vi.fn<(key: string) => string | null>((key) =>
        key === REMEMBER_FLAG_KEY ? 'false' : null,
      ),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    const sessionStorageMock = {
      getItem: vi.fn<(key: string) => string | null>((key) =>
        key === AUTH_SESSION_KEY
          ? JSON.stringify({
              token: 'session-token',
              tokenType: 'Bearer',
              expiresAt: null,
              user: {
                id: 99,
                name: 'Session User',
                email: 'session@example.com',
                roles: ['admin'],
              },
            })
          : null,
      ),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    vi.stubGlobal('localStorage', localStorageMock as unknown as Storage);
    vi.stubGlobal('sessionStorage', sessionStorageMock as unknown as Storage);

    const authStore = useAuthStore();
    authStore.hydrateFromStorage();

    expect(authStore.token).toBe('session-token');
    expect(authStore.user?.email).toBe('session@example.com');
    expect(authStore.status).toBe('authenticated');
  });

  it('marks login route as guestOnly and disables requiresAuth', () => {
    const loginRoute = findRouteByName(routes, 'auth-login');
    expect(loginRoute).toBeTruthy();
    expect(loginRoute?.meta?.guestOnly).toBe(true);
    expect(loginRoute?.meta?.requiresAuth).toBe(false);
  });

  it('redirects root path to login for unauthenticated users', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = await createTestRouter();
    const authStore = useAuthStore();

    // Ensure user is not authenticated
    authStore.clearSession();
    expect(authStore.isAuthenticated).toBe(false);

    // Navigate to root path
    await router.push('/');
    await router.isReady();

    // Should redirect to login without redirect parameter
    expect(router.currentRoute.value.name).toBe('auth-login');
    expect(router.currentRoute.value.query).not.toHaveProperty('redirect');
  });

  it('redirects root path to dashboard for authenticated users', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = await createTestRouter();
    const authStore = useAuthStore();

    // Mock authenticated user
    authStore.token = 'fake-token';
    authStore.status = 'authenticated';
    authStore.user = { id: 1, name: 'Test User', email: 'test@example.com', roles: ['admin'] };
    expect(authStore.isAuthenticated).toBe(true);

    // Navigate to root path
    await router.push('/');
    await router.isReady();

    // Should redirect to dashboard
    expect(router.currentRoute.value.name).toBe('dashboard');
  });
});

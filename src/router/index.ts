import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useAuthStore } from '@/stores/auth/useAuthStore';

export default defineRouter(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    if (!authStore.token) {
      authStore.hydrateFromStorage();
    }

    const isGuestOnly = to.matched.some((record) => record.meta?.guestOnly);
    const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth !== false);

    if (isGuestOnly && authStore.isAuthenticated) {
      next(from.fullPath && from.fullPath !== to.fullPath ? from.fullPath : '/dashboard');
      return;
    }

    if (requiresAuth && !authStore.isAuthenticated) {
      if (authStore.token) {
        try {
          await authStore.fetchMe();
        } catch {
          authStore.clearSession();
        }

        if (authStore.isAuthenticated) {
          next();
          return;
        }
      }

      next({
        name: 'auth-login',
        query: { redirect: to.fullPath },
      });
      return;
    }

    next();
  });

  return router;
});

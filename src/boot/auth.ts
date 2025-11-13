import { defineBoot } from '#q-app/wrappers';
import { useAuthStore } from '@/stores/auth/useAuthStore';
import { UNAUTHORIZED_EVENT } from '@/boot/axios';

export default defineBoot(async ({ router }) => {
  const authStore = useAuthStore();
  authStore.hydrateFromStorage();

  const ensureAuthenticatedUser = async () => {
    if (!authStore.token) {
      return;
    }

    try {
      await authStore.fetchMe();
    } catch (error) {
      console.error('Failed to fetch current user, clearing session', error);
      authStore.clearSession();
      if (router.currentRoute.value.name !== 'auth-login') {
        await router.replace({ name: 'auth-login' });
      }
    }
  };

  await ensureAuthenticatedUser();

  if (typeof window !== 'undefined') {
    const handleUnauthorized = () => {
      authStore.clearSession();
      if (router.currentRoute.value.name !== 'auth-login') {
        void router.push({ name: 'auth-login' });
      }
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }
});
<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="menuStore.toggleDrawer"
        />

        <q-toolbar-title>Roiet App</q-toolbar-title>

        <q-space />

        <div v-if="authUser" class="row items-center q-gutter-sm">
          <q-avatar color="primary" text-color="white">
            {{ initials }}
          </q-avatar>
          <div class="column">
            <span class="text-subtitle2">{{ authUser.name }}</span>
            <span class="text-caption text-grey-6">{{ authUser.email }}</span>
          </div>
          <q-btn
            flat
            dense
            icon="logout"
            color="secondary"
            :loading="logoutInProgress"
            @click="handleLogout"
          />
        </div>
      </q-toolbar>
    </q-header>

    <SideMenu />

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, type QVueGlobals } from 'quasar';
import SideMenu from '@/components/menu/SideMenu.vue';
import { useMenuStore } from '@/stores/menu-store';
import { useAuthStore } from '@/stores/auth/useAuthStore';

const menuStore = useMenuStore();
const authStore = useAuthStore();
const router = useRouter();

const logoutInProgress = ref(false);

const authUser = computed(() => authStore.user);
const initials = computed(() => {
  if (!authStore.user?.name) {
    return '?';
  }

  return authStore.user.name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
});

let $q: QVueGlobals | null = null;

try {
  $q = useQuasar();
} catch {
  $q = null;
}

if ($q) {
  watch(
    () => $q?.screen.gt.sm ?? false,
    (isDesktop) => {
      menuStore.setDrawer(isDesktop);
    },
    { immediate: true },
  );
}

const handleLogout = async () => {
  if (logoutInProgress.value) {
    return;
  }

  logoutInProgress.value = true;
  try {
    await authStore.logout();
    await router.push({ name: 'auth-login' });
  } finally {
    logoutInProgress.value = false;
  }
};
</script>

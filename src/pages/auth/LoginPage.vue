<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="login-card">
      <q-card-section>
        <div class="text-h6 text-primary text-center q-mb-sm">
          {{ t('auth.login.title') }}
        </div>
        <div class="text-subtitle2 text-center text-grey-7">
          {{ t('auth.login.subtitle') }}
        </div>
      </q-card-section>

      <q-separator inset />

      <q-card-section>
        <q-form @submit="handleSubmit" @reset="handleReset" class="column q-gutter-md">
          <q-input
            v-model="credentials.email"
            type="email"
            :label="t('auth.login.email')"
            standout
            dense
            :disable="loading"
            :rules="emailRules"
            autocomplete="email"
          />

          <q-input
            v-model="credentials.password"
            type="password"
            :label="t('auth.login.password')"
            standout
            dense
            :disable="loading"
            :rules="passwordRules"
            autocomplete="current-password"
          />

          <q-banner v-if="errorMessage" class="bg-red-1 text-red-8 q-pa-sm" rounded>
            {{ errorMessage }}
          </q-banner>

          <q-checkbox
            v-model="rememberMe"
            :label="t('auth.login.remember')"
            :disable="loading"
          />

          <div class="column q-gutter-sm">
            <q-btn
              type="submit"
              color="primary"
              :label="t('auth.login.submit')"
              :loading="loading"
              unelevated
            />
            <q-btn
              type="reset"
              color="secondary"
              :label="t('auth.login.reset')"
              flat
              :disable="loading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth/useAuthStore';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const authStore = useAuthStore();

const credentials = reactive({
  email: '',
  password: '',
});

const loading = ref(false);
const errorMessage = computed(() => authStore.errorMessage);
const rememberMe = computed({
  get: () => authStore.rememberMe,
  set: (value: boolean) => authStore.setRememberMe(value),
});

const emailRules = [
  (value: string) => !!value || t('auth.login.emailRequired'),
  (value: string) => /.+@.+\..+/.test(value) || t('auth.login.emailInvalid'),
];

const passwordRules = [(value: string) => !!value || t('auth.login.passwordRequired')];

const resolveRedirectTarget = () => {
  const redirect = route.query.redirect as string | undefined;
  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    return redirect;
  }

  return '/dashboard';
};

const handleSubmit = async () => {
  loading.value = true;

  try {
    await authStore.login({ ...credentials, remember: rememberMe.value });
    await router.push(resolveRedirectTarget());
  } catch (error) {
    console.error('Login failed', error);
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  credentials.email = '';
  credentials.password = '';
  authStore.setRememberMe(false);
  authStore.clearError();
};
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 420px;
}
</style>

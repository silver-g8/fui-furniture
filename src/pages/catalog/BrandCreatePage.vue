<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h5">{{ t('catalog.brands.createTitle') }}</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <brand-form
          v-model="form"
          :loading="brandStore.saving || submitting"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import BrandForm from '@/components/catalog/BrandForm.vue';
import { useBrandStore } from '@/stores/catalog/useBrandStore';
import type { BrandPayload } from '@/services/catalog/brand.service';
import { useCrudForm } from '@/composables/useCrudForm';

const router = useRouter();
const { t } = useI18n();
const brandStore = useBrandStore();

const form = ref<BrandPayload>({
  name: '',
  slug: '',
  code: '',
  websiteUrl: null,
  logoUrl: null,
  isActive: true,
});

const { execute: submitBrand, loading: submitting } = useCrudForm<BrandPayload, void>({
  submit: async (payload) => {
    await brandStore.create(payload);
  },
  successMessage: t('catalog.brands.notify.createSuccess'),
  errorMessage: t('catalog.brands.notify.loadError'),
  onSuccess: async () => {
    await router.push({ name: 'catalog-brands-list' });
  },
});

const handleSubmit = async (payload: BrandPayload) => {
  await submitBrand(payload);
};

const handleCancel = () => {
  router.back();
};
</script>


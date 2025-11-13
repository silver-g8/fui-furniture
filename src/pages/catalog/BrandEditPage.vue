<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div class="text-h5">{{ t('catalog.brands.editTitle') }}</div>
        <q-btn
          flat
          color="primary"
          icon="arrow_back"
          :label="t('catalog.brands.actions.cancel')"
          @click="handleCancel"
        />
      </q-card-section>

      <q-separator />

      <q-card-section v-if="brandStore.loading" class="q-pa-lg flex flex-center">
        <q-spinner size="48px" color="primary" />
      </q-card-section>

      <q-card-section v-else>
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
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import BrandForm from '@/components/catalog/BrandForm.vue';
import { useBrandStore } from '@/stores/catalog/useBrandStore';
import type { BrandPayload } from '@/services/catalog/brand.service';
import { useNotifier } from '@/composables/useNotifier';
import { useCrudForm } from '@/composables/useCrudForm';
import { useLoadingOverlay } from '@/composables/useLoadingOverlay';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const brandStore = useBrandStore();
const { error: notifyError } = useNotifier();
const { withLoading } = useLoadingOverlay();

const brandId = Number(route.params.id);
const form = ref<BrandPayload>({
  name: '',
  slug: '',
  code: '',
  websiteUrl: null,
  logoUrl: null,
  isActive: true,
});

const syncFromBrand = () => {
  const brand = brandStore.current;
  if (!brand) {
    return;
  }
  form.value = {
    name: brand.name,
    slug: brand.slug,
    code: brand.code,
    websiteUrl: brand.websiteUrl ?? null,
    logoUrl: brand.logoUrl ?? null,
    isActive: brand.isActive,
  };
};

watch(
  () => brandStore.current,
  () => syncFromBrand(),
);

const load = async () => {
  try {
    await withLoading(() => brandStore.loadById(brandId), {
      message: t('catalog.common.loading'),
    });
    syncFromBrand();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : t('catalog.brands.notify.loadError');
    notifyError({ message });
  }
};

const { execute: submitBrand, loading: submitting } = useCrudForm<BrandPayload, void>({
  submit: async (payload) => {
    await brandStore.update(brandId, payload);
  },
  successMessage: t('catalog.brands.notify.updateSuccess'),
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

onMounted(() => {
  void load();
});

onBeforeUnmount(() => {
  brandStore.clearCurrent();
});
</script>


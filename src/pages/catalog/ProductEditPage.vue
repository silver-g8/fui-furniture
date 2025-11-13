<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div class="text-h5">
          {{ t('catalog.products.editTitle') }}
        </div>
        <q-btn
          flat
          color="primary"
          icon="visibility"
          :label="t('catalog.products.actions.view')"
          @click="goToDetail"
        />
      </q-card-section>

      <q-separator />

      <q-card-section v-if="productsLoading" class="q-pa-lg flex flex-center">
        <q-spinner size="48px" color="primary" />
      </q-card-section>

      <q-card-section v-else>
        <product-form
          v-model="form"
          :loading="productsSaving || submitting"
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
import ProductForm from '@/components/catalog/ProductForm.vue';
import type { ProductPayload } from '@/types/catalog';
import { useNotifier } from '@/composables/useNotifier';
import { useCrudForm } from '@/composables/useCrudForm';
import { useLoadingOverlay } from '@/composables/useLoadingOverlay';
import { useProducts } from '@/composables/useProducts';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const {
  current,
  loading: productsLoading,
  saving: productsSaving,
  fetchProduct,
  update: updateProduct,
  resetCurrent,
} = useProducts();
const { error: notifyError } = useNotifier();
const { withLoading } = useLoadingOverlay();

const productId = Number(route.params.id);
const form = ref<ProductPayload>({
  sku: '',
  name: '',
  description: null,
  status: 'draft',
  price: 0,
  cost: null,
  brandId: null,
  categoryId: null,
  onHand: 0,
  imageUrl: null,
});

const syncFromProduct = () => {
  const product = current.value;
  if (!product) {
    return;
  }
  form.value = {
    sku: product.sku,
    name: product.name,
    description: product.description ?? null,
    status: product.status,
    price: product.price,
    cost: product.cost ?? null,
    brandId: product.brandId ?? product.brand?.id ?? null,
    categoryId: product.categoryId ?? product.category?.id ?? null,
    onHand: product.onHand,
    imageUrl: product.imageUrl ?? null,
  };
};

watch(
  () => current.value,
  () => {
    syncFromProduct();
  },
);

const load = async () => {
  try {
    await withLoading(() => fetchProduct(productId), {
      message: t('catalog.common.loading'),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : t('catalog.products.notify.loadError');
    notifyError({ message });
  }
};

const { execute: submitProduct, loading: submitting } = useCrudForm<ProductPayload, void>({
  submit: async (payload) => {
    await updateProduct(productId, payload);
  },
  successMessage: t('catalog.products.notify.updateSuccess'),
  errorMessage: t('catalog.products.notify.loadError'),
  onSuccess: async () => {
    await router.push({ name: 'catalog-products-list' });
  },
});

const handleSubmit = async (payload: ProductPayload) => {
  await submitProduct(payload);
};

const handleCancel = () => {
  router.back();
};

const goToDetail = () => {
  void router.push({ name: 'catalog-products-detail', params: { id: productId } });
};

onMounted(() => {
  void (async () => {
    await load();
    syncFromProduct();
  })();
});

onBeforeUnmount(() => {
  resetCurrent();
});
</script>


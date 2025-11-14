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
          :category-options="categoryOptions"
          :brand-options="brandOptions"
          :product-id="productId"
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
import { fetchCategoryList } from '@/services/catalog/category.service';
import { fetchBrands } from '@/services/catalog/brand.service';

interface Option {
  value: number;
  label: string;
}

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
const categoryOptions = ref<Option[]>([]);
const brandOptions = ref<Option[]>([]);
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

const loadCategoryOptions = async () => {
  try {
    const { data } = await fetchCategoryList({ perPage: 100 });
    categoryOptions.value = data.map((item) => ({
      value: item.id,
      label: item.name,
    }));
  } catch (error) {
    console.error('[ProductEditPage] loadCategoryOptions failed', error);
    notifyError({ message: t('catalog.products.notify.categoryLoadError') });
  }
};

const loadBrandOptions = async () => {
  try {
    const { data } = await fetchBrands({ perPage: 100 });
    brandOptions.value = data.map((item) => ({
      value: item.id,
      label: item.name,
    }));
  } catch (error) {
    console.error('[ProductEditPage] loadBrandOptions failed', error);
    notifyError({ message: t('catalog.products.notify.brandLoadError') });
  }
};

onMounted(() => {
  void (async () => {
    await Promise.all([loadCategoryOptions(), loadBrandOptions(), load()]);
    syncFromProduct();
  })();
});

onBeforeUnmount(() => {
  resetCurrent();
});
</script>


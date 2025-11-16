<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h5">{{ t('catalog.products.createTitle') }}</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <product-form
          v-model="form"
          :loading="productsSaving || submitting"
          :category-options="categoryOptions"
          :brand-options="brandOptions"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ProductForm from '@/components/catalog/ProductForm.vue';
import type { ProductPayload } from '@/types/catalog';
import { useCrudForm } from '@/composables/useCrudForm';
import { useProducts } from '@/composables/useProducts';
import { fetchCategoryList } from '@/services/catalog/category.service';
import { fetchBrands } from '@/services/catalog/brand.service';

interface Option {
  value: number;
  label: string;
}

const router = useRouter();
const { t } = useI18n();
const { create, saving: productsSaving } = useProducts();

const categoryOptions = ref<Option[]>([]);
const brandOptions = ref<Option[]>([]);

const form = ref<ProductPayload>({
  sku: '',
  name: '',
  description: null,
  status: 'draft',
  priceTagged: null,
  cost: null,
  brandId: null,
  categoryId: null,
  onHand: 0,
  imageUrl: null,
});

const loadCategoryOptions = async () => {
  try {
    const { data } = await fetchCategoryList({ perPage: 100 });
    categoryOptions.value = data.map((item) => ({
      value: item.id,
      label: item.name,
    }));
  } catch (error) {
    console.error('[ProductCreatePage] loadCategoryOptions failed', error);
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
    console.error('[ProductCreatePage] loadBrandOptions failed', error);
  }
};

onMounted(() => {
  void loadCategoryOptions();
  void loadBrandOptions();
});

const { execute: submitProduct, loading: submitting } = useCrudForm<ProductPayload, void>({
  submit: async (payload) => {
    await create(payload);
  },
  successMessage: t('catalog.products.notify.createSuccess'),
  onSuccess: async () => {
    await router.push({ name: 'catalog-products-list' });
  },
  errorMessage: t('catalog.products.notify.loadError'),
});

const handleSubmit = async (payload: ProductPayload) => {
  await submitProduct(payload);
};

const handleCancel = () => {
  router.back();
};
</script>

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
import ProductForm from '@/components/catalog/ProductForm.vue';
import type { ProductPayload } from '@/types/catalog';
import { useCrudForm } from '@/composables/useCrudForm';
import { useProducts } from '@/composables/useProducts';

const router = useRouter();
const { t } = useI18n();
const { create, saving: productsSaving } = useProducts();

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


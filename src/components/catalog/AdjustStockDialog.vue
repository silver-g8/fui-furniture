<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="min-width: 420px; max-width: 520px">
      <q-card-section>
        <div class="text-h6">
          {{ t('catalog.stock.adjustTitle', { name: product?.name ?? '' }) }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form ref="formRef" @submit.prevent="handleSubmit">
          <div class="q-gutter-md">
            <q-select
              v-model="formState.type"
              :options="typeOptions"
              emit-value
              map-options
              :label="t('catalog.stock.fields.type')"
              :disable="loading"
              :rules="[requiredRule]"
              outlined
              dense
            />

            <q-input
              v-model.number="formState.quantity"
              type="number"
              :label="t('catalog.stock.fields.quantity')"
              :rules="[requiredQuantity]"
              :disable="loading"
              min="1"
              outlined
              dense
            />

            <q-input
              v-model.number="formState.warehouseId"
              type="number"
              :label="t('catalog.stock.fields.warehouse')"
              :rules="[requiredRule]"
              :disable="loading"
              outlined
              dense
            />

            <q-input
              v-model="formState.reason"
              :label="t('catalog.stock.fields.reason')"
              :rules="[requiredRule]"
              :disable="loading"
              outlined
              dense
            />

            <q-input
              v-model="formState.reference"
              :label="t('catalog.stock.fields.reference')"
              :disable="loading"
              outlined
              dense
            />
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat :label="t('catalog.stock.actions.cancel')" :disable="loading" @click="handleCancel" />
        <q-btn
          color="primary"
          :label="t('catalog.stock.actions.submit')"
          :loading="loading"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { reactive, ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QForm } from 'quasar';
import type { Product, StockAdjustPayload } from '@/types/catalog';

const props = defineProps<{
  modelValue: boolean;
  product: Product | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', payload: StockAdjustPayload): void;
  (e: 'cancel'): void;
}>();

const { t } = useI18n();
const formRef = ref<QForm>();
const formState = reactive<StockAdjustPayload>({
  productId: props.product?.id ?? 0,
  warehouseId: 1,
  quantity: 1,
  type: 'adjust_in',
  reason: '',
  reference: '',
});

const typeOptions = computed(() => [
  { label: t('catalog.stock.types.adjust_in'), value: 'adjust_in' },
  { label: t('catalog.stock.types.adjust_out'), value: 'adjust_out' },
]);

const requiredRule = (value: unknown) => {
  if (value === null || value === undefined) {
    return t('catalog.validation.required');
  }
  if (typeof value === 'string') {
    return value.trim().length > 0 || t('catalog.validation.required');
  }
  if (typeof value === 'number') {
    return !Number.isNaN(value) || t('catalog.validation.required');
  }
  return true;
};

const requiredQuantity = (value: number | null | undefined) =>
  (value ?? 0) > 0 || t('catalog.validation.quantityPositive');

watch(
  () => props.product,
  (product) => {
    if (!product) {
      return;
    }
    formState.productId = product.id;
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      formState.productId = props.product?.id ?? 0;
    } else {
      resetForm();
    }
  },
);

const resetForm = () => {
  formState.quantity = 1;
  formState.type = 'adjust_in';
  formState.reason = '';
  formState.reference = '';
  formState.warehouseId = 1;
};

const handleSubmit = async () => {
  const form = formRef.value;
  if (!form) {
    return;
  }

  const valid = await form.validate();
  if (!valid) {
    return;
  }

  emit('submit', { ...formState });
};

const handleCancel = () => {
  emit('cancel');
  emit('update:modelValue', false);
  resetForm();
};
</script>


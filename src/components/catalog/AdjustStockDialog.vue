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

            <q-select
              v-model="formState.warehouseId"
              :options="warehouseOptions"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              :label="t('catalog.stock.fields.warehouse')"
              :rules="[requiredRule]"
              :disable="loading"
              :loading="warehousesLoading"
              outlined
              dense
              clearable
            >
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    ไม่พบคลังสินค้า
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

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
import { reactive, ref, watch, computed, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QForm } from 'quasar';
import type { Product, StockAdjustPayload } from '@/types/catalog';
import { listWarehouses, type Warehouse } from '@/services/sales/api';

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
const warehouseOptions = ref<Warehouse[]>([]);
const warehousesLoading = ref(false);

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
  () => props.product?.id,
  (newProductId, oldProductId) => {
    // Reset form when product changes (only if dialog is open and product actually changed)
    if (props.modelValue && newProductId && oldProductId && newProductId !== oldProductId) {
      resetForm(false);
      // Update productId
      if (props.product) {
        formState.productId = props.product.id;
      }
    } else if (props.product) {
      formState.productId = props.product.id;
    }
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      // Reset form when dialog opens - skip warehouse reset for now
      resetForm(false);
      // Wait for next tick to ensure form is reset before loading warehouses
      await nextTick();
      // Load warehouses after reset
      await loadWarehouses();
      // Set warehouse selection after warehouses are loaded
      if (warehouseOptions.value.length > 0) {
        const firstWarehouse = warehouseOptions.value[0];
        if (firstWarehouse) {
          formState.warehouseId = firstWarehouse.id;
        }
      } else {
        formState.warehouseId = 1;
      }
    } else {
      resetForm();
    }
  },
);

onMounted(() => {
  void loadWarehouses();
});

const loadWarehouses = async () => {
  warehousesLoading.value = true;
  try {
    warehouseOptions.value = await listWarehouses();
  } catch (error) {
    console.error('Failed to load warehouses:', error);
    warehouseOptions.value = [];
  } finally {
    warehousesLoading.value = false;
  }
};

const resetForm = (resetWarehouse = true) => {
  // Reset all form fields to default values
  formState.quantity = 1;
  formState.type = 'adjust_in';
  formState.reason = '';
  formState.reference = '';
  formState.productId = props.product?.id ?? 0;
  // Reset warehouse only if requested (skip when we'll set it after loading)
  if (resetWarehouse) {
    formState.warehouseId = warehouseOptions.value.length > 0 
      ? warehouseOptions.value[0]?.id ?? 1 
      : 1;
  }
  // Reset form validation
  void nextTick(() => {
    formRef.value?.resetValidation();
  });
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
  // Reset form after successful submit
  resetForm();
};

const handleCancel = () => {
  emit('cancel');
  emit('update:modelValue', false);
  resetForm();
};
</script>


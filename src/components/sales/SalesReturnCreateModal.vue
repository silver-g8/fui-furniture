<template>
  <q-dialog :model-value="modelValue" @update:model-value="(val) => $emit('update:modelValue', val)" persistent>
    <q-card style="min-width: 700px; max-width: 1000px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">สร้างใบคืนสินค้า</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup @click="handleClose" />
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleSubmit" ref="formRef">
          <div class="q-gutter-md">
            <!-- Warehouse -->
            <q-select
              v-model="formData.warehouse_id"
              label="คลังสินค้า *"
              :options="warehouses"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              outlined
              dense
              :rules="[(val) => !!val || 'กรุณาเลือกคลังสินค้า']"
            />

            <!-- Reason -->
            <q-input
              v-model="formData.reason"
              label="เหตุผล"
              outlined
              dense
              maxlength="255"
            />

            <!-- Notes -->
            <q-input
              v-model="formData.notes"
              label="หมายเหตุ"
              type="textarea"
              rows="3"
              outlined
              dense
            />

            <!-- Items Table -->
            <div class="text-body2 q-mb-sm text-weight-medium">รายการสินค้าที่ต้องการคืน</div>
            <q-table
              flat
              bordered
              :rows="returnItems"
              :columns="columns"
              row-key="id"
              hide-pagination
              class="q-mb-md"
            >
              <template #body-cell-product="props">
                <q-td :props="props">
                  <div class="text-weight-medium">{{ props.row.product?.name || '-' }}</div>
                  <div class="text-caption text-grey-7">{{ props.row.product?.sku || '-' }}</div>
                </q-td>
              </template>

              <template #body-cell-available_qty="props">
                <q-td :props="props" class="text-right">
                  {{ props.value }}
                </q-td>
              </template>

              <template #body-cell-return_qty="props">
                <q-td :props="props">
                  <q-input
                    v-model.number="props.row.return_qty"
                    type="number"
                    min="1"
                    :max="props.row.available_qty"
                    outlined
                    dense
                    :rules="[
                      (val) => !!val || 'กรุณาระบุจำนวน',
                      (val) => val > 0 || 'จำนวนต้องมากกว่า 0',
                      (val) => val <= props.row.available_qty || `จำนวนต้องไม่เกิน ${props.row.available_qty}`,
                    ]"
                    @update:model-value="updateTotal"
                  />
                </q-td>
              </template>

              <template #body-cell-price="props">
                <q-td :props="props" class="text-right">
                  {{ formatCurrency(props.value) }}
                </q-td>
              </template>

              <template #body-cell-total="props">
                <q-td :props="props" class="text-right text-weight-medium">
                  {{ formatCurrency(props.value) }}
                </q-td>
              </template>

              <template #body-cell-actions="props">
                <q-td :props="props" class="text-center">
                  <q-btn
                    flat
                    dense
                    round
                    color="negative"
                    icon="delete"
                    @click="removeItem(props.rowIndex)"
                  />
                </q-td>
              </template>
            </q-table>

            <!-- Total -->
            <div class="row justify-end q-mb-md">
              <div class="text-h6">
                ยอดรวม: <span class="text-primary">{{ formatCurrency(totalAmount) }}</span>
              </div>
            </div>

            <div class="row q-gutter-sm justify-end">
              <q-btn flat label="ยกเลิก" color="grey" @click="handleClose" />
              <q-btn
                type="submit"
                label="สร้างใบคืนสินค้า"
                color="primary"
                :loading="loading"
                :disable="returnItems.length === 0"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { SalesOrderItem } from '@/types/sales';
import {
  createSalesReturn,
  type SalesReturnPayload,
} from '@/services/sales/salesReturn.service';
import { formatCurrency } from '@/types/ar/common';

interface Props {
  modelValue: boolean;
  salesOrderId: number;
  items: SalesOrderItem[];
  warehouseId?: number | null;
}

interface ReturnItem {
  id?: number;
  product_id: number;
  product?: SalesOrderItem['product'];
  available_qty: number;
  return_qty: number | null;
  price: number;
  remark?: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submitted: [];
}>();

const $q = useQuasar();
const formRef = ref();
const loading = ref(false);
const warehouses = ref<Array<{ id: number; name: string }>>([]);

const formData = ref<{
  warehouse_id: number | null;
  reason: string | null;
  notes: string | null;
}>({
  warehouse_id: null,
  reason: null,
  notes: null,
});

const returnItems = ref<ReturnItem[]>([]);

const columns = [
  {
    name: 'product',
    label: 'สินค้า',
    field: 'product',
    align: 'left' as const,
  },
  {
    name: 'available_qty',
    label: 'จำนวนที่จัดส่งแล้ว',
    field: 'available_qty',
    align: 'right' as const,
  },
  {
    name: 'return_qty',
    label: 'จำนวนที่จะคืน',
    field: 'return_qty',
    align: 'center' as const,
  },
  {
    name: 'price',
    label: 'ราคา',
    field: 'price',
    align: 'right' as const,
  },
  {
    name: 'total',
    label: 'รวม',
    field: (row: ReturnItem) => (row.return_qty || 0) * row.price,
    align: 'right' as const,
  },
  {
    name: 'actions',
    label: '',
    field: '',
    align: 'center' as const,
  },
];

const totalAmount = computed(() => {
  return returnItems.value.reduce((sum, item) => {
    return sum + (item.return_qty || 0) * item.price;
  }, 0);
});

const updateTotal = () => {
  // Trigger reactive update
};

const initializeItems = () => {
  returnItems.value = props.items
    .filter((item) => {
      const delivered = item.delivered_qty || 0;
      return delivered > 0;
    })
    .map((item): ReturnItem => {
      const delivered = item.delivered_qty || 0;
      return {
        ...(item.id !== undefined && { id: item.id }),
        product_id: item.product_id,
        product: item.product,
        available_qty: delivered,
        return_qty: null,
        price: item.price,
        remark: null,
      };
    });

  // Set default warehouse
  if (props.warehouseId) {
    formData.value.warehouse_id = props.warehouseId;
  }
};

const removeItem = (index: number) => {
  returnItems.value.splice(index, 1);
};

const loadWarehouses = () => {
  try {
    // TODO: Load warehouses from API
    // For now, use empty array
    warehouses.value = [];
  } catch (error) {
    console.error('Failed to load warehouses:', error);
  }
};

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      initializeItems();
      void loadWarehouses();
    }
  },
  { immediate: true },
);

watch(
  () => props.items,
  () => {
    if (props.modelValue) {
      initializeItems();
    }
  },
  { deep: true },
);

const handleClose = () => {
  emit('update:modelValue', false);
  returnItems.value = [];
  formData.value = {
    warehouse_id: null,
    reason: null,
    notes: null,
  };
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  const isValid = await formRef.value.validate();
  if (!isValid) {
    return;
  }

  if (returnItems.value.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'กรุณาเลือกรายการสินค้าที่ต้องการคืน',
    });
    return;
  }

  const itemsWithQty = returnItems.value.filter((item) => (item.return_qty || 0) > 0);
  if (itemsWithQty.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'กรุณาระบุจำนวนที่จะคืนอย่างน้อย 1 รายการ',
    });
    return;
  }

  if (!formData.value.warehouse_id) {
    $q.notify({
      type: 'warning',
      message: 'กรุณาเลือกคลังสินค้า',
    });
    return;
  }

  loading.value = true;
  try {
    const payload: SalesReturnPayload = {
      sales_order_id: props.salesOrderId,
      warehouse_id: formData.value.warehouse_id,
      reason: formData.value.reason || null,
      notes: formData.value.notes || null,
      items: itemsWithQty.map((item) => ({
        product_id: item.product_id,
        quantity: item.return_qty!,
        price: item.price,
        remark: item.remark || null,
      })),
    };

    await createSalesReturn(payload);
    $q.notify({
      type: 'positive',
      message: 'สร้างใบคืนสินค้าสำเร็จ',
    });
    emit('submitted');
    handleClose();
  } catch (error: unknown) {
    const message =
      (error && typeof error === 'object' && 'response' in error
        ? (error.response as { data?: { message?: string } })?.data?.message
        : null) ||
      (error instanceof Error ? error.message : null) ||
      'เกิดข้อผิดพลาด';
    $q.notify({
      type: 'negative',
      message,
    });
  } finally {
    loading.value = false;
  }
};
</script>


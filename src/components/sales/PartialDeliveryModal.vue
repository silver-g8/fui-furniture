<template>
  <q-dialog :model-value="modelValue" @update:model-value="(val) => $emit('update:modelValue', val)" persistent>
    <q-card style="min-width: 600px; max-width: 900px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">จัดส่งบางส่วน</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup @click="handleClose" />
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleSubmit" ref="formRef">
          <div class="text-body2 q-mb-md text-grey-7">
            กรุณาระบุจำนวนที่ต้องการจัดส่งสำหรับแต่ละรายการ
          </div>

          <q-table
            flat
            bordered
            :rows="deliveryItems"
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

            <template #body-cell-warehouse="props">
              <q-td :props="props">
                {{ props.row.warehouse?.name || '-' }}
              </q-td>
            </template>

            <template #body-cell-qty="props">
              <q-td :props="props" class="text-right">
                {{ props.value }}
              </q-td>
            </template>

            <template #body-cell-delivered_qty="props">
              <q-td :props="props" class="text-right">
                {{ props.value || 0 }}
              </q-td>
            </template>

            <template #body-cell-remaining="props">
              <q-td :props="props" class="text-right text-weight-medium">
                {{ props.value }}
              </q-td>
            </template>

            <template #body-cell-deliver_qty="props">
              <q-td :props="props">
                <q-input
                  v-model.number="props.row.deliver_qty"
                  type="number"
                  min="1"
                  :max="props.row.remaining"
                  outlined
                  dense
                  :rules="[
                    (val) => !!val || 'กรุณาระบุจำนวน',
                    (val) => val > 0 || 'จำนวนต้องมากกว่า 0',
                    (val) => val <= props.row.remaining || `จำนวนต้องไม่เกิน ${props.row.remaining}`,
                  ]"
                  @update:model-value="validateForm"
                />
              </q-td>
            </template>
          </q-table>

          <div class="row q-gutter-sm justify-end">
            <q-btn flat label="ยกเลิก" color="grey" @click="handleClose" />
            <q-btn
              type="submit"
              label="ยืนยันการจัดส่ง"
              color="primary"
              :loading="loading"
              :disable="!canSubmit"
            />
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
import { partialDeliverSalesOrder, type PartialDeliveryItem } from '@/services/sales/salesOrder.service';

interface Props {
  modelValue: boolean;
  salesOrderId: number;
  items: SalesOrderItem[];
}

interface DeliveryItem extends SalesOrderItem {
  delivered_qty: number;
  remaining: number;
  deliver_qty: number | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submitted: [];
}>();

const $q = useQuasar();
const formRef = ref();
const loading = ref(false);

const deliveryItems = ref<DeliveryItem[]>([]);

const columns = [
  {
    name: 'product',
    label: 'สินค้า',
    field: 'product',
    align: 'left' as const,
  },
  {
    name: 'warehouse',
    label: 'คลังสินค้า',
    field: (row: DeliveryItem) => row.warehouse?.name || '-',
    align: 'left' as const,
  },
  {
    name: 'qty',
    label: 'จำนวนทั้งหมด',
    field: 'qty',
    align: 'right' as const,
  },
  {
    name: 'delivered_qty',
    label: 'จัดส่งแล้ว',
    field: 'delivered_qty',
    align: 'right' as const,
  },
  {
    name: 'remaining',
    label: 'ค้างส่ง',
    field: 'remaining',
    align: 'right' as const,
  },
  {
    name: 'deliver_qty',
    label: 'จำนวนที่จะจัดส่ง',
    field: 'deliver_qty',
    align: 'center' as const,
  },
];

const canSubmit = computed(() => {
  return deliveryItems.value.some((item) => (item.deliver_qty || 0) > 0);
});

const validateForm = () => {
  // Trigger validation
  if (formRef.value) {
    formRef.value.validate();
  }
};

const initializeItems = () => {
  deliveryItems.value = props.items.map((item) => {
    const delivered = item.delivered_qty || 0;
    const qty = item.qty;
    const remaining = qty - delivered;

    return {
      ...item,
      delivered_qty: delivered,
      remaining,
      deliver_qty: remaining > 0 ? null : 0,
    };
  });
};

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      initializeItems();
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
  deliveryItems.value = [];
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  const isValid = await formRef.value.validate();
  if (!isValid) {
    return;
  }

  const deliveries: PartialDeliveryItem[] = deliveryItems.value
    .filter((item) => (item.deliver_qty || 0) > 0)
    .map((item) => ({
      id: item.id!,
      qty: item.deliver_qty!,
    }));

  if (deliveries.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'กรุณาระบุจำนวนที่จะจัดส่งอย่างน้อย 1 รายการ',
    });
    return;
  }

  loading.value = true;
  try {
    await partialDeliverSalesOrder(props.salesOrderId, { deliveries });
    $q.notify({
      type: 'positive',
      message: 'จัดส่งบางส่วนสำเร็จ',
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


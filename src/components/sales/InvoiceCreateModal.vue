<template>
  <q-dialog :model-value="modelValue" @update:model-value="(val) => $emit('update:modelValue', val)" persistent>
    <q-card style="min-width: 600px; max-width: 800px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">สร้างใบแจ้งหนี้</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup @click="handleClose" />
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleSubmit" ref="formRef">
          <div class="q-gutter-md">
            <!-- Invoice Date -->
            <q-input
              v-model="formData.invoice_date"
              label="วันที่ใบแจ้งหนี้ *"
              type="date"
              outlined
              dense
              :rules="[(val) => !!val || 'กรุณาระบุวันที่ใบแจ้งหนี้']"
            />

            <!-- Due Date -->
            <q-input
              v-model="formData.due_date"
              label="วันที่ครบกำหนดชำระ"
              type="date"
              outlined
              dense
              :rules="[
                (val) => {
                  if (val && formData.invoice_date) {
                    const dueDate = new Date(val);
                    const invoiceDate = new Date(formData.invoice_date);
                    return dueDate >= invoiceDate || 'วันที่ครบกำหนดชำระต้องเป็นวันเดียวกันหรือหลังวันที่ใบแจ้งหนี้';
                  }
                  return true;
                },
              ]"
            />

            <!-- Payment Term -->
            <q-select
              v-model="formData.payment_term_id"
              label="เงื่อนไขการชำระเงิน"
              :options="paymentTermOptions"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              outlined
              dense
              clearable
              :loading="paymentTermsLoading"
            >
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">ไม่พบเงื่อนไขการชำระเงิน</q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- Discount Amount -->
            <q-input
              v-model.number="formData.discount_amount"
              label="ส่วนลด"
              type="number"
              outlined
              dense
              :rules="[(val) => val === null || val === '' || val >= 0 || 'ส่วนลดต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0']"
            />

            <!-- Tax Amount -->
            <q-input
              v-model.number="formData.tax_amount"
              label="ภาษี"
              type="number"
              outlined
              dense
              :rules="[(val) => val === null || val === '' || val >= 0 || 'ภาษีต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0']"
            />

            <!-- Notes -->
            <q-input
              v-model="formData.notes"
              label="หมายเหตุ"
              type="textarea"
              rows="3"
              outlined
              dense
              maxlength="1000"
            />

            <!-- Invoice Preview -->
            <q-separator />
            <div class="text-subtitle1 q-mt-md">ตัวอย่างใบแจ้งหนี้</div>
            <q-card flat bordered class="q-mt-sm">
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <div class="text-body2 text-grey-7">รายการสินค้า</div>
                    <q-table
                      flat
                      dense
                      :rows="salesOrderItems"
                      :columns="previewColumns"
                      row-key="id"
                      hide-pagination
                      :rows-per-page-options="[0]"
                    >
                      <template #body-cell-total="props">
                        <q-td :props="props" class="text-right">
                          {{ formatCurrency(props.value) }}
                        </q-td>
                      </template>
                    </q-table>
                  </div>
                  <div class="col-12">
                    <div class="row justify-end q-mt-md">
                      <div class="col-auto">
                        <div class="text-body2">
                          <div class="row q-col-gutter-sm">
                            <div class="col-6 text-right">ยอดรวม:</div>
                            <div class="col-6 text-right">{{ formatCurrency(previewTotals.subtotal) }}</div>
                          </div>
                          <div class="row q-col-gutter-sm" v-if="formData.discount_amount">
                            <div class="col-6 text-right">ส่วนลด:</div>
                            <div class="col-6 text-right">{{ formatCurrency(formData.discount_amount || 0) }}</div>
                          </div>
                          <div class="row q-col-gutter-sm" v-if="formData.tax_amount">
                            <div class="col-6 text-right">ภาษี:</div>
                            <div class="col-6 text-right">{{ formatCurrency(formData.tax_amount || 0) }}</div>
                          </div>
                          <q-separator class="q-mt-xs q-mb-xs" />
                          <div class="row q-col-gutter-sm">
                            <div class="col-6 text-right text-weight-bold">ยอดรวมทั้งสิ้น:</div>
                            <div class="col-6 text-right text-weight-bold text-primary">
                              {{ formatCurrency(previewTotals.grandTotal) }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="ยกเลิก" color="grey" @click="handleClose" :disable="loading" />
        <q-btn
          flat
          label="สร้างใบแจ้งหนี้"
          color="primary"
          @click="handleSubmit"
          :loading="loading"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { InvoiceCreatePayload } from '@/services/sales/salesOrder.service';
import type { SalesOrder, SalesOrderItem } from '@/types/sales';
import type { QTableProps } from 'quasar';
import { formatCurrency } from '@/types/ar/common';

interface Props {
  modelValue: boolean;
  salesOrder: SalesOrder | null;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submitted', payload: InvoiceCreatePayload): void;
}

interface PaymentTerm {
  id: number;
  name: string;
  code: string;
  net_days: number;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Load payment terms
const loadPaymentTerms = () => {
  paymentTermsLoading.value = true;
  try {
    // TODO: Load payment terms from API
    // For now, use empty array
    paymentTermOptions.value = [];
  } catch (error) {
    console.error('Failed to load payment terms:', error);
  } finally {
    paymentTermsLoading.value = false;
  }
};

const formRef = ref();
const loading = ref(false);
const paymentTermsLoading = ref(false);
const paymentTermOptions = ref<PaymentTerm[]>([]);

const formData = ref<Partial<InvoiceCreatePayload>>({
  invoice_date: new Date().toISOString().split('T')[0] as string,
  payment_term_id: null,
  discount_amount: 0,
  tax_amount: 0,
  notes: null,
});

const salesOrderItems = computed(() => {
  return props.salesOrder?.items || [];
});

const previewTotals = computed(() => {
  const subtotal = salesOrderItems.value.reduce((sum, item) => sum + (item.total || 0), 0);
  const discount = formData.value.discount_amount || 0;
  const tax = formData.value.tax_amount || 0;
  const grandTotal = subtotal - discount + tax;

  return {
    subtotal,
    discount,
    tax,
    grandTotal,
  };
});

const previewColumns: QTableProps['columns'] = [
  {
    name: 'product',
    label: 'สินค้า',
    field: (row: SalesOrderItem) => row.product?.name || `Product ID ${row.product_id}`,
    align: 'left' as const,
  },
  {
    name: 'qty',
    label: 'จำนวน',
    field: 'qty',
    align: 'right' as const,
  },
  {
    name: 'price',
    label: 'ราคา',
    field: 'price',
    align: 'right' as const,
    format: (val: number) => formatCurrency(val),
  },
  {
    name: 'total',
    label: 'รวม',
    field: 'total',
    align: 'right' as const,
  },
];


// Reset form when modal opens
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      resetForm();
      void loadPaymentTerms();
    }
  },
);

// Auto-calculate due date when payment term changes
watch(
  () => formData.value.payment_term_id,
  (paymentTermId) => {
    if (paymentTermId && formData.value.invoice_date) {
      const paymentTerm = paymentTermOptions.value.find((pt) => pt.id === paymentTermId);
      if (paymentTerm) {
        const invoiceDate = new Date(formData.value.invoice_date);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + paymentTerm.net_days);
        formData.value.due_date = dueDate.toISOString().split('T')[0] as string;
      }
    }
  },
);

const resetForm = () => {
  formData.value = {
    invoice_date: new Date().toISOString().split('T')[0] as string,
    payment_term_id: null,
    discount_amount: 0,
    tax_amount: 0,
    notes: null,
  };
  formRef.value?.resetValidation();
};

const handleClose = () => {
  emit('update:modelValue', false);
  resetForm();
};

const handleSubmit = async () => {
  const isValid = await formRef.value?.validate();
  if (!isValid) {
    return;
  }

  // Prepare payload
  const payload: InvoiceCreatePayload = {
    invoice_date: formData.value.invoice_date as string,
    ...(formData.value.due_date && { due_date: formData.value.due_date }),
    payment_term_id: formData.value.payment_term_id || null,
    discount_amount: formData.value.discount_amount || 0,
    tax_amount: formData.value.tax_amount || 0,
    notes: formData.value.notes || null,
  };

  emit('submitted', payload);
};
</script>


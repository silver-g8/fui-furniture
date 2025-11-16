<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card>
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h5">
          {{ isEditMode ? $t('ar.invoice.edit') : $t('ar.invoice.create') }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="handleCancel" />
      </q-card-section>

      <q-separator />

      <!-- Form Content -->
      <q-card-section class="scroll" style="max-height: calc(100vh - 150px)">
        <q-form ref="formRef" @submit="handleSubmit">
          <div class="row q-col-gutter-md">
            <!-- Customer Selection -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-medium q-mb-md">
                    {{ $t('ar.common.customer') }}
                  </div>
                  <q-select
                    v-model="form.customer_id"
                    :options="customerOptions"
                    :label="$t('ar.common.customer')"
                    option-value="id"
                    option-label="name"
                    emit-value
                    map-options
                    outlined
                    use-input
                    input-debounce="300"
                    :loading="loadingCustomers"
                    :rules="[
                      (val) => !!val || $t('ar.validation.must_select_customer'),
                    ]"
                    @filter="filterCustomers"
                  >
                    <template #no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          {{ $t('ar.common.no_results') }}
                        </q-item-section>
                      </q-item>
                    </template>

                    <template #option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section>
                          <q-item-label>{{ scope.opt.name }}</q-item-label>
                          <q-item-label caption>{{ scope.opt.code }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </q-card-section>
              </q-card>
            </div>

            <!-- Invoice Details -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-medium q-mb-md">
                    {{ $t('ar.invoice.detail') }}
                  </div>

                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6">
                      <q-input
                        v-model="form.invoice_date"
                        :label="$t('ar.invoice.invoice_date')"
                        type="date"
                        outlined
                        :rules="[(val) => !!val || $t('ar.validation.required')]"
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <q-input
                        v-model="form.due_date"
                        :label="$t('ar.invoice.due_date')"
                        type="date"
                        outlined
                        :rules="[
                          (val) => !!val || $t('ar.validation.required'),
                          (val) => val >= form.invoice_date || $t('ar.validation.due_date_after_invoice'),
                        ]"
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <q-select
                        v-model="form.payment_term_id"
                        :options="paymentTermOptions"
                        :label="$t('ar.invoice.payment_term')"
                        option-value="id"
                        option-label="name"
                        emit-value
                        map-options
                        outlined
                        clearable
                      />
                    </div>

                    <div class="col-12">
                      <q-input
                        v-model="form.note"
                        :label="$t('ar.common.note')"
                        type="textarea"
                        outlined
                        rows="3"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Line Items -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <line-item-editor v-model="form.items" />
                  <div v-if="showItemsError" class="text-negative text-caption q-mt-sm">
                    {{ $t('ar.validation.must_add_line_items') }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-form>
      </q-card-section>

      <!-- Footer Actions -->
      <q-separator />
      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          flat
          :label="$t('ar.common.cancel')"
          color="grey-7"
          @click="handleCancel"
        />
        <q-btn
          unelevated
          :label="$t('ar.common.save')"
          color="primary"
          :loading="saving"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import type { QForm } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Invoice, InvoicePayload } from '@/types/ar/invoice';
import { createInvoice, updateInvoice } from '@/services/ar/invoiceService';
import { useNotifier } from '@/composables/useNotifier';
import LineItemEditor from '@/components/ar/LineItemEditor.vue';

interface CustomerOption {
  id: number;
  code: string;
  name: string;
}

interface PaymentTermOption {
  id: number;
  code: string;
  name: string;
}

interface Props {
  modelValue: boolean;
  invoice?: Invoice | null;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}

const props = withDefaults(defineProps<Props>(), {
  invoice: null,
});

const emit = defineEmits<Emits>();
const { t } = useI18n();
const { success: notifySuccess, error: notifyError } = useNotifier();

// Refs
const formRef = ref<QForm>();
const saving = ref(false);
const showItemsError = ref(false);
const loadingCustomers = ref(false);

const getTodayDateString = (): string => {
  return new Date().toISOString().slice(0, 10);
};

// Form state
const form = ref<InvoicePayload>({
  customer_id: 0,
  invoice_date: getTodayDateString(),
  due_date: getTodayDateString(),
  payment_term_id: null,
  items: [],
  note: null,
});

// Mock data - In production, these should come from API
const customerOptions = ref<CustomerOption[]>([
  { id: 1, code: 'C001', name: 'บริษัท ABC จำกัด' },
  { id: 2, code: 'C002', name: 'บริษัท XYZ จำกัด' },
  { id: 3, code: 'C003', name: 'ร้าน DEF' },
]);

const paymentTermOptions = ref<PaymentTermOption[]>([
  { id: 1, code: 'NET30', name: 'Net 30 days' },
  { id: 2, code: 'NET60', name: 'Net 60 days' },
  { id: 3, code: 'COD', name: 'Cash on Delivery' },
]);

// Computed
const isEditMode = computed(() => !!props.invoice);

// Methods
const resetForm = () => {
  form.value = {
    customer_id: 0,
    invoice_date: getTodayDateString(),
    due_date: getTodayDateString(),
    payment_term_id: null,
    items: [],
    note: null,
  };
  showItemsError.value = false;
};

// Watch for invoice changes (edit mode)
watch(
  () => props.invoice,
  (newInvoice) => {
    if (newInvoice) {
      form.value = {
        customer_id: newInvoice.customer.id,
        invoice_date: newInvoice.invoice_date,
        due_date: newInvoice.due_date,
        payment_term_id: newInvoice.payment_term_id,
        items:
          newInvoice.items?.map((item) => ({
            product_id: item.product_id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_amount: item.discount_amount,
            tax_amount: item.tax_amount,
            // Normalize note so it is always string | null (no undefined)
            note: item.note ?? null,
          })) || [],
        note: newInvoice.note,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

const filterCustomers = (val: string, update: (fn: () => void) => void) => {
  // In production, this should call an API to search customers
  update(() => {
    if (val === '') {
      customerOptions.value = [
        { id: 1, code: 'C001', name: 'บริษัท ABC จำกัด' },
        { id: 2, code: 'C002', name: 'บริษัท XYZ จำกัด' },
        { id: 3, code: 'C003', name: 'ร้าน DEF' },
      ];
    } else {
      const needle = val.toLowerCase();
      customerOptions.value = [
        { id: 1, code: 'C001', name: 'บริษัท ABC จำกัด' },
        { id: 2, code: 'C002', name: 'บริษัท XYZ จำกัด' },
        { id: 3, code: 'C003', name: 'ร้าน DEF' },
      ].filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          c.code.toLowerCase().includes(needle),
      );
    }
  });
};

const validateForm = (): boolean => {
  // Check if there are line items
  if (!form.value.items || form.value.items.length === 0) {
    showItemsError.value = true;
    return false;
  }
  showItemsError.value = false;
  return true;
};

const handleSubmit = async () => {
  // Validate form
  const formValid = await formRef.value?.validate();
  const itemsValid = validateForm();

  if (!formValid || !itemsValid) {
    return;
  }

  saving.value = true;
  try {
    if (isEditMode.value && props.invoice) {
      // Update existing invoice
      await updateInvoice(props.invoice.id, form.value);
      notifySuccess({ message: t('ar.invoice.messages.update_success') });
    } else {
      // Create new invoice
      await createInvoice(form.value);
      notifySuccess({ message: t('ar.invoice.messages.create_success') });
    }

    emit('saved');
    emit('update:modelValue', false);
    resetForm();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : isEditMode.value
          ? t('ar.invoice.update_error')
          : t('ar.invoice.create_error');
    notifyError({ message });
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  emit('update:modelValue', false);
  resetForm();
};

onMounted(() => {
  // Load payment terms if needed
  // In production, this should call an API
});
</script>

<style scoped lang="scss">
:deep(.q-dialog__backdrop) {
  backdrop-filter: blur(4px);
}
</style>

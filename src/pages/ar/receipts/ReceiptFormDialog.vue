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
          {{ isEditMode ? $t('ar.receipt.edit') : $t('ar.receipt.create') }}
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
                    clearable
                    use-input
                    input-debounce="300"
                    :loading="loadingCustomers"
                    :rules="[
                      (val) => !!val || $t('ar.validation.must_select_customer'),
                    ]"
                    @filter="filterCustomers"
                    @update:model-value="onCustomerChange"
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

            <!-- Receipt Details -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-medium q-mb-md">
                    {{ $t('ar.receipt.detail') }}
                  </div>

                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6">
                      <q-input
                        v-model="form.receipt_date"
                        :label="$t('ar.receipt.receipt_date')"
                        type="date"
                        outlined
                        :rules="[(val) => !!val || $t('ar.validation.required')]"
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <q-input
                        v-model.number="form.amount"
                        :label="$t('ar.receipt.amount')"
                        type="number"
                        outlined
                        min="0"
                        step="0.01"
                        :rules="[
                          (val) => !!val || $t('ar.validation.required'),
                          (val) => val > 0 || $t('ar.validation.invalid_amount'),
                        ]"
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <q-select
                        v-model="form.payment_method"
                        :options="paymentMethodOptions"
                        :label="$t('ar.receipt.payment_method')"
                        emit-value
                        map-options
                        outlined
                        :disable="isPaymentMethodLocked"
                        :rules="[(val) => !!val || $t('ar.validation.required')]"
                      >
                        <template v-if="isPaymentMethodLocked" #prepend>
                          <q-icon name="lock" color="grey-7" />
                        </template>
                      </q-select>
                    </div>

                    <div v-if="showBankAccount" class="col-12 col-md-6">
                      <q-input
                        v-model="form.bank_account"
                        :label="$t('ar.receipt.bank_account')"
                        outlined
                      />
                    </div>

                    <div v-if="showChequeFields" class="col-12 col-md-6">
                      <q-input
                        v-model="form.cheque_no"
                        :label="$t('ar.receipt.cheque_no')"
                        outlined
                      />
                    </div>

                    <div v-if="showChequeFields" class="col-12 col-md-6">
                      <q-input
                        v-model="form.cheque_date"
                        :label="$t('ar.receipt.cheque_date')"
                        type="date"
                        outlined
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <q-input
                        v-model="form.reference_no"
                        :label="$t('ar.receipt.reference_no')"
                        outlined
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

            <!-- Allocations -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <allocation-editor
                    v-model="form.allocations"
                    v-if="form.customer_id !== null"
                    :customer-id="form.customer_id"
                    :receipt-amount="form.amount || 0"
                    :available-invoices="availableInvoices"
                  />
                  <div v-else class="text-center q-pa-lg text-grey-6">
                    <q-icon name="info" size="48px" class="q-mb-sm" />
                    <div>{{ $t('ar.receipt.select_customer_first') }}</div>
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
import type { Receipt, ReceiptPayload, ReceiptAllocationPayload } from '@/types/ar/receipt';
import { createReceipt, updateReceipt } from '@/services/ar/receiptService';
import { useNotifier } from '@/composables/useNotifier';
import AllocationEditor from '@/components/ar/AllocationEditor.vue';
import { getCustomerOutstandingInvoices } from '@/services/sales/customerArService';
import { getInvoiceById } from '@/services/ar/invoiceService';
import type { Invoice } from '@/types/ar/invoice';
import { listCustomers, type Customer } from '@/services/sales/api';
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/types/ar/common';

interface CustomerOption {
  id: number;
  code: string;
  name: string;
}

interface InvoiceOption {
  id: number;
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  open_amount: string;
  grand_total: string;
}

interface Props {
  modelValue: boolean;
  receipt?: Receipt | null;
  invoiceId?: number | null; // Invoice ID to pre-fill data from (e.g., from Cash Sale)
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}

const props = withDefaults(defineProps<Props>(), {
  receipt: null,
  invoiceId: null,
});

const emit = defineEmits<Emits>();
const { t } = useI18n();
const { success: notifySuccess, error: notifyError } = useNotifier();

// Refs
const formRef = ref<QForm>();
const saving = ref(false);
const loadingCustomers = ref(false);
const loadingInvoices = ref(false);

const getTodayDateString = (): string => {
  return new Date().toISOString().slice(0, 10);
};

// Form state with required allocations array
interface FormState extends Omit<ReceiptPayload, 'allocations' | 'customer_id'> {
  customer_id: number | null;
  allocations: ReceiptAllocationPayload[];
}

const form = ref<FormState>({
  customer_id: null as number | null,
  receipt_date: getTodayDateString(),
  amount: 0,
  payment_method: 'cash',
  bank_account: null,
  cheque_no: null,
  cheque_date: null,
  reference_no: null,
  allocations: [],
  note: null,
});

// Customer options - loaded from API
const customerOptions = ref<CustomerOption[]>([]);

const availableInvoices = ref<InvoiceOption[]>([]);
const sourceInvoice = ref<Invoice | null>(null);
const loadingInvoice = ref(false);

// Use same payment methods as Cash Sale page
const paymentMethodOptions = computed(() => 
  Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
    label,
    value: value as PaymentMethod,
  }))
);

// Computed
const isEditMode = computed(() => !!props.receipt);

// Check if payment method is locked (from Cash Sale)
const isPaymentMethodLocked = computed(() => {
  return sourceInvoice.value?.is_pending_payment === true;
});

const showBankAccount = computed(() => {
  return form.value.payment_method === 'bank_transfer' || form.value.payment_method === 'credit_card';
});

const showChequeFields = computed(() => {
  return form.value.payment_method === 'cheque' || form.value.payment_method === 'promissory_note';
});

// Methods
const resetForm = () => {
  form.value = {
    customer_id: null as number | null,
    receipt_date: getTodayDateString(),
    amount: 0,
    payment_method: 'cash',
    bank_account: null,
    cheque_no: null,
    cheque_date: null,
    reference_no: null,
    allocations: [],
    note: null,
  };
  availableInvoices.value = [];
};

// Watch for receipt changes (edit mode)
watch(
  () => props.receipt,
  (newReceipt) => {
    if (newReceipt) {
      form.value = {
        customer_id: newReceipt.customer.id,
        receipt_date: newReceipt.receipt_date,
        amount: parseFloat(newReceipt.total_amount || newReceipt.amount || '0'),
        payment_method: newReceipt.payment_method,
        bank_account: newReceipt.bank_account,
        cheque_no: newReceipt.cheque_no,
        cheque_date: newReceipt.cheque_date,
        reference_no: newReceipt.reference_no,
        allocations:
          newReceipt.allocations?.map((alloc) => ({
            invoice_id: alloc.invoice_id,
            amount: parseFloat(alloc.allocated_amount.toString()),
          })) || [],
        note: newReceipt.note,
      };

      // Load invoices for this customer
      void loadInvoicesForCustomer(newReceipt.customer.id);
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

// Watch for invoiceId prop changes (when opening from Invoice Detail)
watch(
  () => props.invoiceId,
  (newInvoiceId) => {
    if (newInvoiceId && !props.receipt) {
      void loadSourceInvoice(newInvoiceId);
    }
  },
  { immediate: true },
);

const filterCustomers = (val: string, update: (fn: () => void) => void) => {
  // Call API to search customers
  loadingCustomers.value = true;
  update(() => {
    void (async () => {
      try {
        const params: { per_page: number; search?: string } = {
          per_page: 20, // Limit to 20 results for performance
        };
        if (val) {
          params.search = val;
        }
        
        const response = await listCustomers(params);
        
        // Transform API response to match CustomerOption interface
        customerOptions.value = response.data.map((customer: Customer) => ({
          id: customer.id,
          code: customer.code,
          name: customer.name,
        }));
      } catch (error) {
        console.error('Failed to load customers:', error);
        customerOptions.value = [];
      } finally {
        loadingCustomers.value = false;
      }
    })();
  });
};

const onCustomerChange = (customerId: number | null) => {
  // Reset allocations when customer changes
  form.value.allocations = [];
  sourceInvoice.value = null;

  // Load outstanding invoices for this customer
  if (customerId) {
    console.log('[ReceiptFormDialog] onCustomerChange: Loading invoices for customer', customerId);
    void loadInvoicesForCustomer(customerId);
  } else {
    console.log('[ReceiptFormDialog] onCustomerChange: Clearing invoices (no customer selected)');
    availableInvoices.value = [];
  }
};

// Debug: Watch availableInvoices changes
watch(
  availableInvoices,
  (newVal) => {
    console.log('[ReceiptFormDialog] availableInvoices changed:', newVal);
    console.log('[ReceiptFormDialog] availableInvoices length:', newVal.length);
  },
  { immediate: true, deep: true },
);

// Load invoice data when invoiceId prop is provided
const loadSourceInvoice = async (invoiceId: number) => {
  loadingInvoice.value = true;
  try {
    const invoice = await getInvoiceById(invoiceId);
    sourceInvoice.value = invoice;
    
    // Pre-fill form data from invoice
    if (invoice.customer) {
      form.value.customer_id = invoice.customer.id;
      
      // Load invoices for this customer
      await loadInvoicesForCustomer(invoice.customer.id);
      
      // Pre-select this invoice in allocations
      if (invoice.open_amount && parseFloat(invoice.open_amount) > 0) {
        form.value.allocations = [
          {
            invoice_id: invoice.id,
            amount: parseFloat(invoice.open_amount),
          },
        ];
        form.value.amount = parseFloat(invoice.open_amount);
      }
      
      // Set payment method from invoice if available
      if (invoice.payment_method) {
        form.value.payment_method = invoice.payment_method as PaymentMethod;
      }
    }
  } catch (error) {
    console.error('Failed to load invoice:', error);
    notifyError({ message: t('ar.invoice.load_error') });
  } finally {
    loadingInvoice.value = false;
  }
};

const loadInvoicesForCustomer = async (customerId: number) => {
  if (!customerId) {
    availableInvoices.value = [];
    return;
  }

  loadingInvoices.value = true;
  try {
    // Call API to get outstanding invoices
    const invoices = await getCustomerOutstandingInvoices(customerId);
    
    // Debug: Log invoices to check if pending payment invoices are included
    console.log(`[ReceiptFormDialog] Loaded ${invoices.length} invoices for customer ${customerId}:`, invoices);
    
    // Transform API response to match InvoiceOption interface
    availableInvoices.value = invoices.map((invoice) => ({
      id: invoice.invoice_id,
      invoice_no: invoice.invoice_no,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date || invoice.invoice_date,
      open_amount: invoice.open_amount.toString(),
      grand_total: invoice.grand_total.toString(),
    }));
    
    // Debug: Log transformed invoices
    console.log('[ReceiptFormDialog] Transformed invoices:', availableInvoices.value);
  } catch (error) {
    console.error('Failed to load invoices:', error);
    notifyError({ message: t('ar.receipt.errors.load_invoices_failed') });
    availableInvoices.value = [];
  } finally {
    loadingInvoices.value = false;
  }
};

const validateAllocations = (): boolean => {
  // Check if allocations exceed receipt amount
  const totalAllocated = form.value.allocations?.reduce(
    (sum, alloc) => sum + (alloc.amount || 0),
    0,
  ) || 0;

  if (totalAllocated > form.value.amount) {
    notifyError({ message: t('ar.validation.allocation_exceeds_amount') });
    return false;
  }

  return true;
};

const handleSubmit = async () => {
  // Validate customer_id is not null
  if (!form.value.customer_id) {
    notifyError({ message: t('ar.validation.must_select_customer') });
    return;
  }

  // Validate form
  const formValid = await formRef.value?.validate();
  const allocationsValid = validateAllocations();

  if (!formValid || !allocationsValid) {
    return;
  }

  saving.value = true;
  try {
    // Prepare payload - ensure customer_id is number (not null)
    // We already validated that customer_id is not null above
    // Use type narrowing by storing the value
    const customerId = form.value.customer_id;
    if (customerId === null) {
      notifyError({ message: t('ar.validation.must_select_customer') });
      return;
    }
    
    const payload: ReceiptPayload = {
      ...form.value,
      customer_id: customerId,
    };

    if (isEditMode.value && props.receipt) {
      // Update existing receipt
      await updateReceipt(props.receipt.id, payload);
      notifySuccess({ message: t('ar.receipt.messages.update_success') });
    } else {
      // Create new receipt
      await createReceipt(payload);
      notifySuccess({ message: t('ar.receipt.messages.create_success') });
    }

    emit('saved');
    emit('update:modelValue', false);
    resetForm();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : isEditMode.value
          ? t('ar.receipt.update_error')
          : t('ar.receipt.create_error');
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
  // Load initial data if needed
});
</script>

<style scoped lang="scss">
:deep(.q-dialog__backdrop) {
  backdrop-filter: blur(4px);
}
</style>

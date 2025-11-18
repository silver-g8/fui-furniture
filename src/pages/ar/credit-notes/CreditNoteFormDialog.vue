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
          {{ isEditMode ? $t('ar.credit_note.edit') : $t('ar.credit_note.create') }}
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

            <!-- Credit Note Details -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-medium q-mb-md">
                    {{ $t('ar.credit_note.detail') }}
                  </div>

                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6">
                      <q-input
                        v-model="form.issue_date"
                        :label="$t('ar.credit_note.issue_date')"
                        type="date"
                        outlined
                        :rules="[(val) => !!val || $t('ar.validation.required')]"
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <q-select
                        v-model="form.type"
                        :options="typeOptions"
                        :label="$t('ar.credit_note.type')"
                        emit-value
                        map-options
                        outlined
                        :rules="[(val) => !!val || $t('ar.validation.required')]"
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <q-input
                        v-model.number="form.amount"
                        :label="$t('ar.credit_note.amount')"
                        type="number"
                        step="0.01"
                        min="0"
                        outlined
                        :rules="[
                          (val) => !!val || $t('ar.validation.required'),
                          (val) => val > 0 || $t('ar.validation.invalid_amount'),
                        ]"
                      />
                    </div>

                    <div class="col-12 col-md-6">
                      <q-select
                        v-model="form.invoice_id"
                        :options="invoiceOptions"
                        :label="$t('ar.invoice.title')"
                        option-value="id"
                        option-label="invoice_no"
                        emit-value
                        map-options
                        outlined
                        clearable
                        :loading="loadingInvoices"
                        :disable="!form.customer_id"
                      >
                        <template #no-option>
                          <q-item>
                            <q-item-section class="text-grey">
                              {{ form.customer_id ? $t('ar.credit_note.no_outstanding_invoices') : $t('ar.credit_note.select_customer_first') }}
                            </q-item-section>
                          </q-item>
                        </template>
                      </q-select>
                    </div>

                    <div class="col-12">
                      <q-input
                        v-model="form.reason"
                        :label="$t('ar.credit_note.reason')"
                        type="textarea"
                        outlined
                        rows="3"
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
import { computed, ref, watch } from 'vue';
import type { QForm } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { CreditNote, CreditNotePayload } from '@/types/ar/creditNote';
import { createCreditNote, updateCreditNote } from '@/services/ar/creditNoteService';
import { useNotifier } from '@/composables/useNotifier';
import { getInvoices } from '@/services/ar/invoiceService';
import type { Invoice } from '@/types/ar/invoice';

interface CustomerOption {
  id: number;
  code: string;
  name: string;
}

interface InvoiceOption {
  id: number;
  invoice_no: string;
  invoice_date: string;
  open_amount: string;
}

interface Props {
  modelValue: boolean;
  creditNote?: CreditNote | null;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}

const props = withDefaults(defineProps<Props>(), {
  creditNote: null,
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

// Form state
const form = ref<CreditNotePayload>({
  customer_id: 0,
  invoice_id: null,
  issue_date: getTodayDateString(),
  amount: 0,
  type: 'adjustment',
  reason: null,
  note: null,
});

// Mock data - In production, these should come from API
const customerOptions = ref<CustomerOption[]>([
  { id: 1, code: 'C001', name: 'บริษัท ABC จำกัด' },
  { id: 2, code: 'C002', name: 'บริษัท XYZ จำกัด' },
  { id: 3, code: 'C003', name: 'ร้าน DEF' },
]);

const invoiceOptions = ref<InvoiceOption[]>([]);

const typeOptions = computed(() => [
  { label: t('ar.credit_note.types.return'), value: 'return' },
  { label: t('ar.credit_note.types.discount'), value: 'discount' },
  { label: t('ar.credit_note.types.adjustment'), value: 'adjustment' },
]);

// Computed
const isEditMode = computed(() => !!props.creditNote);

// Methods
const resetForm = () => {
  form.value = {
    customer_id: 0,
    invoice_id: null,
    issue_date: getTodayDateString(),
    amount: 0,
    type: 'adjustment',
    reason: null,
    note: null,
  };
  invoiceOptions.value = [];
};

// Watch for credit note changes (edit mode)
watch(
  () => props.creditNote,
  (newCreditNote) => {
    if (newCreditNote) {
      form.value = {
        customer_id: newCreditNote.customer.id,
        invoice_id: newCreditNote.invoice?.id ?? null,
        issue_date: newCreditNote.issue_date,
        amount: parseFloat(newCreditNote.amount),
        type: newCreditNote.type,
        reason: newCreditNote.reason,
        note: newCreditNote.note,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

// Watch customer_id to load invoices
watch(
  () => form.value.customer_id,
  async (customerId) => {
    if (!customerId) {
      invoiceOptions.value = [];
      form.value.invoice_id = null;
      return;
    }

    loadingInvoices.value = true;
    try {
      // Load outstanding invoices for this customer
      const response = await getInvoices({
        customer_id: customerId,
        has_balance: true,
        status: ['issued', 'partially_paid', 'overdue'],
        per_page: 100,
      });

      invoiceOptions.value = response.data.map((inv: Invoice) => ({
        id: inv.id,
        invoice_no: inv.invoice_no,
        invoice_date: inv.invoice_date,
        open_amount: inv.open_amount,
      }));
    } catch (error) {
      console.error('Failed to load invoices:', error);
      invoiceOptions.value = [];
    } finally {
      loadingInvoices.value = false;
    }
  },
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

const handleSubmit = async () => {
  // Validate form
  const formValid = await formRef.value?.validate();

  if (!formValid) {
    return;
  }

  saving.value = true;
  try {
    if (isEditMode.value && props.creditNote) {
      // Update existing credit note
      await updateCreditNote(props.creditNote.id, form.value);
      notifySuccess({ message: t('ar.credit_note.messages.update_success') });
    } else {
      // Create new credit note
      await createCreditNote(form.value);
      notifySuccess({ message: t('ar.credit_note.messages.create_success') });
    }

    emit('saved');
    emit('update:modelValue', false);
    resetForm();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : isEditMode.value
          ? t('ar.credit_note.update_error')
          : t('ar.credit_note.create_error');
    notifyError({ message });
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  emit('update:modelValue', false);
  resetForm();
};
</script>

<style scoped lang="scss">
:deep(.q-dialog__backdrop) {
  backdrop-filter: blur(4px);
}
</style>


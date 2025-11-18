<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="min-width: 400px; max-width: 600px">
      <q-card-section>
        <div class="text-h6">{{ $t('ar.invoice.actions.create_receipt_from_pending_payment') }}</div>
        <div class="text-subtitle2 text-grey-7 q-mt-sm">
          {{ $t('ar.invoice.messages.create_receipt_from_pending_payment_description') }}
        </div>
      </q-card-section>

      <q-card-section>
        <!-- Invoice Info -->
        <div class="q-mb-md">
          <div class="text-caption text-grey-7">{{ $t('ar.invoice.invoice_no') }}</div>
          <div class="text-body1 text-weight-medium">{{ invoice.invoice_no }}</div>
        </div>
        <div class="q-mb-md">
          <div class="text-caption text-grey-7">{{ $t('ar.invoice.open_amount') }}</div>
          <div class="text-body1 text-weight-medium">{{ formatCurrency(invoice.open_amount) }}</div>
        </div>

        <q-separator class="q-my-md" />

        <!-- Payment Method -->
        <q-select
          v-model="paymentMethod"
          :label="$t('ar.receipt.payment_method')"
          :options="paymentMethodOptions"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          filled
          :rules="[(val) => !!val || $t('ar.receipt.errors.payment_method_required')]"
          class="q-mb-md"
        />

        <!-- Receipt Date -->
        <q-input
          v-model="receiptDate"
          :label="$t('ar.receipt.receipt_date')"
          filled
          type="date"
          :rules="[(val) => !!val || $t('ar.receipt.errors.receipt_date_required')]"
          class="q-mb-md"
        />

        <!-- Reference No -->
        <q-input
          v-model="referenceNo"
          :label="$t('ar.receipt.reference_no')"
          filled
          clearable
          class="q-mb-md"
        />

        <!-- Note -->
        <q-input
          v-model="note"
          :label="$t('ar.common.note')"
          filled
          type="textarea"
          rows="3"
          clearable
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat :label="$t('ar.common.cancel')" color="grey-7" @click="onCancelClick" />
        <q-btn
          :label="$t('ar.common.save')"
          color="primary"
          :loading="loading"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Invoice } from '@/types/ar/invoice';
import { formatCurrency, PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/types/ar/common';
import { createReceiptFromPendingPayment, type CreateReceiptFromPendingPaymentPayload } from '@/services/ar/receiptService';
import { useNotifier } from '@/composables/useNotifier';

const props = defineProps<{
  invoice: Invoice;
}>();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();
const { t } = useI18n();
const { success: notifySuccess, error: notifyError } = useNotifier();

// State
const loading = ref(false);
// Use payment_method from invoice if available, otherwise default to empty
const paymentMethod = ref<PaymentMethod | ''>((props.invoice.payment_method as PaymentMethod) || '');
const receiptDate = ref(new Date().toISOString().split('T')[0]);
const referenceNo = ref<string | null>(null);
const note = ref<string | null>(null);

// Use same payment methods as Cash Sale page
const paymentMethodOptions = computed(() => 
  Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
    label,
    value: value as PaymentMethod,
  }))
);

// Handlers
const onCancelClick = () => {
  onDialogCancel();
};

const handleSubmit = async () => {
  if (!paymentMethod.value || !receiptDate.value) {
    return;
  }

  // Validate payment method using type guard
  const validPaymentMethods: readonly PaymentMethod[] = ['cash', 'bank_transfer', 'cheque', 'credit_card', 'promissory_note', 'qr_code', 'online_store'] as const;
  
  const isValidPaymentMethod = (value: string): value is PaymentMethod => {
    return validPaymentMethods.includes(value as PaymentMethod);
  };
  
  if (!paymentMethod.value || !isValidPaymentMethod(paymentMethod.value)) {
    notifyError({ message: t('ar.receipt.errors.payment_method_required') });
    return;
  }

  loading.value = true;
  try {
    const payload: CreateReceiptFromPendingPaymentPayload = {
      payment_method: paymentMethod.value,
      receipt_date: receiptDate.value,
      reference_no: referenceNo.value,
      note: note.value,
    };

    await createReceiptFromPendingPayment(props.invoice.id, payload);
    notifySuccess({ message: t('ar.invoice.messages.create_receipt_from_pending_payment_success') });
    onDialogOK();
  } catch (error) {
    const message = error instanceof Error ? error.message : t('ar.invoice.create_receipt_from_pending_payment_error');
    notifyError({ message });
  } finally {
    loading.value = false;
  }
};
</script>


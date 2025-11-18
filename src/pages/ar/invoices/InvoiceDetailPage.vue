<template>
  <q-page padding>
    <div v-if="loading" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="64px" />
    </div>

    <div v-else-if="invoice">
      <!-- Header -->
      <div class="row items-center justify-between q-mb-lg">
        <div class="row items-center q-gutter-md">
          <q-btn
            flat
            round
            icon="arrow_back"
            color="grey-7"
            @click="goBack"
          >
            <q-tooltip>{{ $t('ar.common.back') }}</q-tooltip>
          </q-btn>
          <div>
            <div class="text-h5">{{ invoice.invoice_no }}</div>
            <div class="text-subtitle2 text-grey-7">
              {{ $t('ar.invoice.detail') }}
            </div>
          </div>
          <invoice-status-badge 
            :status="invoice.status" 
            :is-pending-payment="invoice.is_pending_payment ?? false"
            size="lg" 
          />
        </div>

        <div class="row q-gutter-sm">
          <q-btn
            v-if="canIssue"
            color="positive"
            icon="check_circle"
            :label="$t('ar.invoice.actions.issue')"
            outline
            @click="handleIssue"
          />
          <q-btn
            v-if="canCancel"
            color="negative"
            icon="cancel"
            :label="$t('ar.invoice.actions.cancel')"
            outline
            @click="handleCancel"
          />
          <q-btn
            v-if="canSendReminder"
            color="warning"
            icon="notification_important"
            :label="$t('ar.invoice.actions.send_reminder')"
            outline
            @click="handleSendReminder"
          />
          <q-btn
            flat
            color="primary"
            icon="print"
            :label="$t('ar.common.print')"
            @click="handlePrint"
          />
        </div>
      </div>

      <div class="row q-col-gutter-md">
        <!-- Left Column -->
        <div class="col-12 col-md-8">
          <!-- Invoice Information -->
          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ $t('ar.invoice.detail') }}</div>
              <div class="row q-col-gutter-md">
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.invoice.invoice_no') }}</div>
                  <div class="text-body1 text-weight-medium">{{ invoice.invoice_no }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.common.status') }}</div>
                  <div class="text-body1 text-weight-medium">{{ $t(`ar.invoice.status.${invoice.status}`) }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.invoice.invoice_date') }}</div>
                  <div class="text-body1">{{ formatDate(invoice.invoice_date) }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.invoice.due_date') }}</div>
                  <div class="text-body1" :class="{ 'text-negative': isOverdue }">
                    {{ formatDate(invoice.due_date) }}
                    <span v-if="isOverdue" class="text-caption">
                      ({{ $t('ar.invoice.overdue_days', { days: daysOverdue }) }})
                    </span>
                  </div>
                </div>
                <div v-if="invoice.payment_term" class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.invoice.payment_term') }}</div>
                  <div class="text-body1">{{ invoice.payment_term.name }}</div>
                </div>
                <div v-if="invoice.note" class="col-12">
                  <div class="text-caption text-grey-7">{{ $t('ar.common.note') }}</div>
                  <div class="text-body1">{{ invoice.note }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Customer Information -->
          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ $t('ar.common.customer') }}</div>
              <div class="row q-col-gutter-md">
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.common.customer') }}</div>
                  <div class="text-body1 text-weight-medium">{{ invoice.customer.name }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">รหัสลูกค้า</div>
                  <div class="text-body1">{{ invoice.customer.code }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Line Items -->
          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ $t('ar.invoice.line_items') }}</div>
              <q-table
                flat
                bordered
                :rows="invoice.items || []"
                :columns="lineItemColumns"
                row-key="id"
                :rows-per-page-options="[0]"
                hide-pagination
              >
                <!-- Quantity -->
                <template #body-cell-quantity="props">
                  <q-td :props="props" class="text-right">
                    {{ props.row.quantity }}
                  </q-td>
                </template>

                <!-- Unit Price -->
                <template #body-cell-unit_price="props">
                  <q-td :props="props" class="text-right">
                    {{ formatCurrency(props.row.unit_price) }}
                  </q-td>
                </template>

                <!-- Discount -->
                <template #body-cell-discount_amount="props">
                  <q-td :props="props" class="text-right">
                    {{ formatCurrency(props.row.discount_amount) }}
                  </q-td>
                </template>

                <!-- Tax -->
                <template #body-cell-tax_amount="props">
                  <q-td :props="props" class="text-right">
                    {{ formatCurrency(props.row.tax_amount) }}
                  </q-td>
                </template>

                <!-- Line Total -->
                <template #body-cell-line_total="props">
                  <q-td :props="props" class="text-right text-weight-medium">
                    {{ formatCurrency(props.row.line_total) }}
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
          </q-card>

          <!-- Payment History -->
          <q-card v-if="(invoice.receipts_count ?? 0) > 0" flat bordered class="q-mb-md">
            <q-card-section>
              <div class="row items-center justify-between q-mb-md">
                <div class="text-h6">{{ $t('ar.invoice.payment_history') }}</div>
                <q-chip dense color="primary" text-color="white">
                  {{ invoice.receipts_count }}
                </q-chip>
              </div>
              <div class="text-caption text-grey-7">
                {{ $t('ar.invoice.payment_history_description') }}
              </div>
            </q-card-section>
          </q-card>

          <!-- Credit Notes -->
          <q-card v-if="(invoice.credit_notes_count ?? 0) > 0" flat bordered class="q-mb-md">
            <q-card-section>
              <div class="row items-center justify-between q-mb-md">
                <div class="text-h6">{{ $t('ar.invoice.credit_notes') }}</div>
                <q-chip dense color="info" text-color="white">
                  {{ invoice.credit_notes_count }}
                </q-chip>
              </div>
              <div class="text-caption text-grey-7">
                {{ $t('ar.invoice.credit_notes_description') }}
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Right Column - Summary -->
        <div class="col-12 col-md-4">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ $t('ar.invoice.summary') }}</div>

              <q-list dense class="q-mb-md">
                <q-item>
                  <q-item-section>
                    <q-item-label>{{ $t('ar.invoice.subtotal') }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label class="text-weight-medium">
                      {{ formatCurrency(invoice.subtotal_amount) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label>{{ $t('ar.invoice.discount') }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label class="text-negative">
                      -{{ formatCurrency(invoice.discount_amount) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label>{{ $t('ar.invoice.tax') }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label>
                      {{ formatCurrency(invoice.tax_amount) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-separator class="q-my-sm" />

                <q-item>
                  <q-item-section>
                    <q-item-label class="text-weight-bold text-h6">
                      {{ $t('ar.invoice.grand_total') }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label class="text-weight-bold text-h6 text-primary">
                      {{ formatCurrency(invoice.grand_total) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-separator class="q-my-sm" />

                <q-item>
                  <q-item-section>
                    <q-item-label>{{ $t('ar.invoice.paid_total') }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label class="text-positive">
                      {{ formatCurrency(invoice.paid_total) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">
                      {{ $t('ar.invoice.open_amount') }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label
                      class="text-weight-bold"
                      :class="{
                        'text-negative': parseFloat(invoice.open_amount) > 0,
                        'text-positive': parseFloat(invoice.open_amount) === 0,
                      }"
                    >
                      {{ formatCurrency(invoice.open_amount) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <q-separator />

              <!-- Dates -->
              <div class="q-mt-md">
                <div class="text-caption text-grey-7 q-mb-xs">
                  {{ $t('ar.invoice.created_at') }}
                </div>
                <div class="text-body2">{{ formatDate(invoice.created_at) }}</div>

                <div v-if="invoice.issued_at" class="text-caption text-grey-7 q-mb-xs q-mt-sm">
                  {{ $t('ar.invoice.issued_at') }}
                </div>
                <div v-if="invoice.issued_at" class="text-body2">
                  {{ formatDate(invoice.issued_at) }}
                </div>

                <div v-if="invoice.cancelled_at" class="text-caption text-grey-7 q-mb-xs q-mt-sm">
                  {{ $t('ar.invoice.cancelled_at') }}
                </div>
                <div v-if="invoice.cancelled_at" class="text-body2">
                  {{ formatDate(invoice.cancelled_at) }}
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="text-center q-pa-xl">
      <q-icon name="error_outline" size="64px" color="negative" />
      <div class="text-h6 q-mt-md">{{ $t('ar.invoice.not_found') }}</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Dialog, type QTableProps } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Invoice } from '@/types/ar/invoice';
import {
  canIssueInvoice,
  canCancelInvoice,
  isInvoiceOverdue,
  getDaysOverdue,
} from '@/types/ar/invoice';
import { formatCurrency, formatDate } from '@/types/ar/common';
import { getInvoiceById, issueInvoice, cancelInvoice } from '@/services/ar/invoiceService';
import { useNotifier } from '@/composables/useNotifier';
import InvoiceStatusBadge from '@/components/ar/InvoiceStatusBadge.vue';
import { printHtml, generateInvoiceHtml } from '@/utils/print';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const { success: notifySuccess, error: notifyError } = useNotifier();

// State
const invoice = ref<Invoice | null>(null);
const loading = ref(false);

// Computed
const invoiceId = computed(() => {
  const id = route.params.id;
  return typeof id === 'string' ? parseInt(id, 10) : 0;
});

const isOverdue = computed(() => invoice.value ? isInvoiceOverdue(invoice.value) : false);
const daysOverdue = computed(() => invoice.value ? getDaysOverdue(invoice.value) : 0);
const canIssue = computed(() => invoice.value ? canIssueInvoice(invoice.value) : false);
const canCancel = computed(() => invoice.value ? canCancelInvoice(invoice.value) : false);
const canSendReminder = computed(() => {
  if (!invoice.value) return false;
  return (
    invoice.value.status === 'issued' ||
    invoice.value.status === 'partially_paid' ||
    invoice.value.status === 'overdue'
  );
});

// Table columns for line items
const lineItemColumns = computed<QTableProps['columns']>(() => [
  {
    name: 'description',
    label: t('ar.invoice.description'),
    field: 'description',
    align: 'left' as const,
  },
  {
    name: 'quantity',
    label: t('ar.invoice.quantity'),
    field: 'quantity',
    align: 'right' as const,
  },
  {
    name: 'unit_price',
    label: t('ar.invoice.unit_price'),
    field: 'unit_price',
    align: 'right' as const,
  },
  {
    name: 'discount_amount',
    label: t('ar.invoice.discount'),
    field: 'discount_amount',
    align: 'right' as const,
  },
  {
    name: 'tax_amount',
    label: t('ar.invoice.tax'),
    field: 'tax_amount',
    align: 'right' as const,
  },
  {
    name: 'line_total',
    label: t('ar.invoice.line_total'),
    field: 'line_total',
    align: 'right' as const,
  },
]);

// Load invoice
const loadInvoice = async () => {
  loading.value = true;
  try {
    invoice.value = await getInvoiceById(invoiceId.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : t('ar.invoice.load_error');
    notifyError({ message });
    invoice.value = null;
  } finally {
    loading.value = false;
  }
};

// Actions
const goBack = () => {
  void router.push({ name: 'ar-invoices' });
};

const handleIssue = () => {
  if (!invoice.value) return;

  Dialog.create({
    title: t('ar.invoice.actions.issue'),
    message: t('ar.invoice.messages.confirm_issue'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      if (!invoice.value) return;
      try {
        await issueInvoice(invoice.value.id);
        notifySuccess({ message: t('ar.invoice.messages.issue_success') });
        await loadInvoice();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.invoice.issue_error');
        notifyError({ message });
      }
    })();
  });
};

const handleCancel = () => {
  if (!invoice.value) return;

  Dialog.create({
    title: t('ar.invoice.actions.cancel'),
    message: t('ar.invoice.messages.confirm_cancel'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      if (!invoice.value) return;
      try {
        await cancelInvoice(invoice.value.id);
        notifySuccess({ message: t('ar.invoice.messages.cancel_success') });
        await loadInvoice();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.invoice.cancel_error');
        notifyError({ message });
      }
    })();
  });
};

const handleSendReminder = () => {
  // TODO: Implement send reminder functionality
  notifySuccess({ message: t('ar.invoice.messages.send_reminder_success') });
};

const handlePrint = () => {
  if (!invoice.value || !invoice.value.items) return;
  const html = generateInvoiceHtml({
    ...invoice.value,
    items: invoice.value.items,
  });
  printHtml(html, `Invoice_${invoice.value.invoice_no}`);
};

onMounted(() => {
  void loadInvoice();
});
</script>

<style scoped lang="scss">
.q-table {
  :deep(th) {
    font-weight: 600;
  }
}
</style>

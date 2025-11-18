<template>
  <q-page padding>
    <div v-if="loading" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="64px" />
    </div>

    <div v-else-if="receipt">
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
            <div class="text-h5">{{ receipt.receipt_no }}</div>
            <div class="text-subtitle2 text-grey-7">
              {{ $t('ar.receipt.detail') }}
            </div>
          </div>
          <receipt-status-badge :status="receipt.status" size="lg" />
        </div>

        <div class="row q-gutter-sm">
          <q-btn
            v-if="canPost"
            color="positive"
            icon="check_circle"
            :label="$t('ar.receipt.actions.post')"
            outline
            @click="handlePost"
          />
          <q-btn
            v-if="canCancel"
            color="negative"
            icon="cancel"
            :label="$t('ar.receipt.actions.cancel')"
            outline
            @click="handleCancel"
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
          <!-- Receipt Information -->
          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ $t('ar.receipt.detail') }}</div>
              <div class="row q-col-gutter-md">
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.receipt.receipt_no') }}</div>
                  <div class="text-body1 text-weight-medium">{{ receipt.receipt_no }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.common.status') }}</div>
                  <div class="text-body1 text-weight-medium">{{ $t(`ar.receipt.status.${receipt.status}`) }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.receipt.receipt_date') }}</div>
                  <div class="text-body1">{{ formatDate(receipt.receipt_date) }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.receipt.amount') }}</div>
                  <div class="text-body1 text-weight-medium text-primary">{{ formatCurrency(receipt.total_amount || receipt.amount || '0') }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.receipt.payment_method') }}</div>
                  <div class="text-body1">
                    <payment-method-badge :payment-method="receipt.payment_method" size="sm" />
                  </div>
                </div>
                <div v-if="receipt.bank_account" class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.receipt.bank_account') }}</div>
                  <div class="text-body1">{{ receipt.bank_account }}</div>
                </div>
                <div v-if="receipt.cheque_no" class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.receipt.cheque_no') }}</div>
                  <div class="text-body1">{{ receipt.cheque_no }}</div>
                </div>
                <div v-if="receipt.cheque_date" class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.receipt.cheque_date') }}</div>
                  <div class="text-body1">{{ formatDate(receipt.cheque_date) }}</div>
                </div>
                <div v-if="receipt.reference_no" class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.receipt.reference_no') }}</div>
                  <div class="text-body1">{{ receipt.reference_no }}</div>
                </div>
                <div v-if="receipt.note" class="col-12">
                  <div class="text-caption text-grey-7">{{ $t('ar.common.note') }}</div>
                  <div class="text-body1">{{ receipt.note }}</div>
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
                  <div class="text-body1 text-weight-medium">{{ receipt.customer.name }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">รหัสลูกค้า</div>
                  <div class="text-body1">{{ receipt.customer.code }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Allocations -->
          <q-card v-if="receipt.allocations && receipt.allocations.length > 0" flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ $t('ar.receipt.allocations') }}</div>
              <q-table
                flat
                bordered
                :rows="receipt.allocations"
                :columns="allocationColumns"
                row-key="id"
                :rows-per-page-options="[0]"
                hide-pagination
              >
                <!-- Invoice Number -->
                <template #body-cell-invoice_no="props">
                  <q-td :props="props">
                    <router-link
                      :to="{ name: 'ar-invoices-detail', params: { id: props.row.invoice_id } }"
                      class="text-primary"
                      style="text-decoration: none"
                    >
                      {{ props.row.invoice?.invoice_no || '-' }}
                    </router-link>
                  </q-td>
                </template>

                <!-- Invoice Date -->
                <template #body-cell-invoice_date="props">
                  <q-td :props="props">
                    {{ props.row.invoice?.invoice_date ? formatDate(props.row.invoice.invoice_date) : '-' }}
                  </q-td>
                </template>

                <!-- Allocated Amount -->
                <template #body-cell-allocated_amount="props">
                  <q-td :props="props" class="text-right text-weight-medium">
                    {{ formatCurrency(props.row.allocated_amount) }}
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
          </q-card>

          <!-- GL Entry (if posted) -->
          <q-card v-if="receipt.gl_entry_id" flat bordered class="q-mb-md">
            <q-card-section>
              <div class="row items-center justify-between q-mb-md">
                <div class="text-h6">{{ $t('ar.receipt.gl_entry') }}</div>
                <q-chip dense color="indigo" text-color="white">
                  GL-{{ receipt.gl_entry_id }}
                </q-chip>
              </div>
              <div class="text-caption text-grey-7">
                {{ $t('ar.receipt.gl_entry_description') }}
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Right Column - Summary -->
        <div class="col-12 col-md-4">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ $t('ar.receipt.summary') }}</div>

              <q-list dense class="q-mb-md">
                <q-item>
                  <q-item-section>
                    <q-item-label class="text-weight-bold text-h6">
                      {{ $t('ar.receipt.amount') }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label class="text-weight-bold text-h6 text-primary">
                      {{ formatCurrency(receipt.total_amount || receipt.amount || '0') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-separator class="q-my-sm" />

                <q-item>
                  <q-item-section>
                    <q-item-label>{{ $t('ar.receipt.allocated_total') }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label class="text-positive">
                      {{ formatCurrency(receipt.allocated_total || '0') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">
                      {{ $t('ar.receipt.unallocated_amount') }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label
                      class="text-weight-bold"
                      :class="{
                        'text-warning': parseFloat(receipt.unallocated_amount || '0') > 0,
                        'text-positive': parseFloat(receipt.unallocated_amount || '0') === 0,
                      }"
                    >
                      {{ formatCurrency(receipt.unallocated_amount || '0') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <q-separator />

              <!-- Dates -->
              <div class="q-mt-md">
                <div class="text-caption text-grey-7 q-mb-xs">
                  {{ $t('ar.receipt.created_at') }}
                </div>
                <div class="text-body2">{{ formatDate(receipt.created_at) }}</div>

                <div v-if="receipt.posted_at" class="text-caption text-grey-7 q-mb-xs q-mt-sm">
                  {{ $t('ar.receipt.posted_at') }}
                </div>
                <div v-if="receipt.posted_at" class="text-body2">
                  {{ formatDate(receipt.posted_at) }}
                </div>

                <div v-if="receipt.cancelled_at" class="text-caption text-grey-7 q-mb-xs q-mt-sm">
                  {{ $t('ar.receipt.cancelled_at') }}
                </div>
                <div v-if="receipt.cancelled_at" class="text-body2">
                  {{ formatDate(receipt.cancelled_at) }}
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
      <div class="text-h6 q-mt-md">{{ $t('ar.receipt.not_found') }}</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Dialog, type QTableProps } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Receipt } from '@/types/ar/receipt';
import { canPostReceipt, canCancelReceipt } from '@/types/ar/receipt';
import { formatCurrency, formatDate } from '@/types/ar/common';
import { getReceiptById, postReceipt, cancelReceipt } from '@/services/ar/receiptService';
import { useNotifier } from '@/composables/useNotifier';
import ReceiptStatusBadge from '@/components/ar/ReceiptStatusBadge.vue';
import PaymentMethodBadge from '@/components/ar/PaymentMethodBadge.vue';
import { printHtml, generateReceiptHtml } from '@/utils/print';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const { success: notifySuccess, error: notifyError } = useNotifier();

// State
const receipt = ref<Receipt | null>(null);
const loading = ref(false);

// Computed
const receiptId = computed(() => {
  const id = route.params.id;
  return typeof id === 'string' ? parseInt(id, 10) : 0;
});

const canPost = computed(() => receipt.value ? canPostReceipt(receipt.value) : false);
const canCancel = computed(() => receipt.value ? canCancelReceipt(receipt.value) : false);

// Table columns for allocations
const allocationColumns = computed<QTableProps['columns']>(() => [
  {
    name: 'invoice_no',
    label: t('ar.invoice.invoice_no'),
    field: 'invoice_no',
    align: 'left' as const,
  },
  {
    name: 'invoice_date',
    label: t('ar.invoice.invoice_date'),
    field: 'invoice_date',
    align: 'left' as const,
  },
  {
    name: 'allocated_amount',
    label: t('ar.receipt.allocated_amount'),
    field: 'allocated_amount',
    align: 'right' as const,
  },
]);

// Load receipt
const loadReceipt = async () => {
  loading.value = true;
  try {
    receipt.value = await getReceiptById(receiptId.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : t('ar.receipt.load_error');
    notifyError({ message });
    receipt.value = null;
  } finally {
    loading.value = false;
  }
};

// Actions
const goBack = () => {
  void router.push({ name: 'ar-receipts' });
};

const handlePost = () => {
  if (!receipt.value) return;

  Dialog.create({
    title: t('ar.receipt.actions.post'),
    message: t('ar.receipt.messages.confirm_post'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      if (!receipt.value) return;
      try {
        await postReceipt(receipt.value.id);
        notifySuccess({ message: t('ar.receipt.messages.post_success') });
        await loadReceipt();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.receipt.post_error');
        notifyError({ message });
      }
    })();
  });
};

const handleCancel = () => {
  if (!receipt.value) return;

  Dialog.create({
    title: t('ar.receipt.actions.cancel'),
    message: t('ar.receipt.messages.confirm_cancel'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      if (!receipt.value) return;
      try {
        await cancelReceipt(receipt.value.id);
        notifySuccess({ message: t('ar.receipt.messages.cancel_success') });
        await loadReceipt();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.receipt.cancel_error');
        notifyError({ message });
      }
    })();
  });
};

const handlePrint = () => {
  if (!receipt.value) return;
  const html = generateReceiptHtml({
    ...receipt.value,
    allocations: (receipt.value.allocations || []).map((alloc) => ({
      invoice: {
        invoice_no: alloc.invoice?.invoice_no || '',
      },
      allocated_amount: alloc.allocated_amount,
    })),
  });
  printHtml(html, `Receipt_${receipt.value.receipt_no}`);
};

onMounted(() => {
  void loadReceipt();
});
</script>

<style scoped lang="scss">
.q-table {
  :deep(th) {
    font-weight: 600;
  }
}
</style>

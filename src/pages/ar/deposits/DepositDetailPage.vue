<template>
  <q-page padding>
    <div v-if="loading" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="64px" />
    </div>

    <div v-else-if="deposit">
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
            <div class="text-h5">{{ deposit.deposit_no }}</div>
            <div class="text-subtitle2 text-grey-7">
              {{ $t('ar.deposit.detail') }}
            </div>
          </div>
          <deposit-status-badge :status="deposit.status" size="lg" />
        </div>

        <div class="row q-gutter-sm">
          <q-btn
            v-if="canAllocate"
            color="positive"
            icon="account_balance_wallet"
            :label="$t('ar.deposit.actions.allocate')"
            outline
            @click="openAllocateDialog"
          />
          <q-btn
            v-if="canRefund"
            color="warning"
            icon="undo"
            :label="$t('ar.deposit.actions.refund')"
            outline
            @click="handleRefund"
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
          <!-- Deposit Information -->
          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ $t('ar.deposit.detail') }}</div>
              <div class="row q-col-gutter-md">
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.deposit.deposit_no') }}</div>
                  <div class="text-body1 text-weight-medium">{{ deposit.deposit_no }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.common.status') }}</div>
                  <div class="text-body1 text-weight-medium">
                    {{ $t(`ar.deposit.status.${deposit.status}`) }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.deposit.deposit_date') }}</div>
                  <div class="text-body1">{{ formatDate(deposit.deposit_date) }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.deposit.payment_method') }}</div>
                  <div class="text-body1">
                    <payment-method-badge :payment-method="deposit.payment_method" />
                  </div>
                </div>
                <div v-if="deposit.payment_ref" class="col-6">
                  <div class="text-caption text-grey-7">{{ $t('ar.deposit.payment_ref') }}</div>
                  <div class="text-body1">{{ deposit.payment_ref }}</div>
                </div>
                <div v-if="deposit.note" class="col-12">
                  <div class="text-caption text-grey-7">{{ $t('ar.common.note') }}</div>
                  <div class="text-body1">{{ deposit.note }}</div>
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
                  <div class="text-body1 text-weight-medium">{{ deposit.customer.name }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">รหัสลูกค้า</div>
                  <div class="text-body1">{{ deposit.customer.code }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Allocations -->
          <q-card v-if="(deposit.allocations_count ?? 0) > 0" flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ $t('ar.deposit.allocations') }}</div>
              <q-table
                flat
                bordered
                :rows="deposit.allocations || []"
                :columns="allocationColumns"
                row-key="id"
                :rows-per-page-options="[0]"
                hide-pagination
              >
                <!-- Invoice -->
                <template #body-cell-invoice="props">
                  <q-td :props="props">
                    <router-link
                      v-if="props.row.invoice"
                      :to="{ name: 'ar-invoices-detail', params: { id: props.row.invoice.id } }"
                      class="text-primary text-weight-medium"
                    >
                      {{ props.row.invoice.invoice_no }}
                    </router-link>
                    <span v-else class="text-grey-6">-</span>
                  </q-td>
                </template>

                <!-- Amount -->
                <template #body-cell-allocated_amount="props">
                  <q-td :props="props" class="text-right">
                    <div class="text-weight-medium">
                      {{ formatCurrency(props.row.allocated_amount) }}
                    </div>
                  </q-td>
                </template>

                <!-- Date -->
                <template #body-cell-created_at="props">
                  <q-td :props="props">
                    {{ formatDate(props.row.created_at) }}
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
          </q-card>
        </div>

        <!-- Right Column - Summary -->
        <div class="col-12 col-md-4">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ $t('ar.deposit.summary') }}</div>

              <q-list dense class="q-mb-md">
                <q-item>
                  <q-item-section>
                    <q-item-label>{{ $t('ar.deposit.amount') }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label class="text-weight-medium">
                      {{ formatCurrency(deposit.amount) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label>{{ $t('ar.deposit.total_allocated') }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label>
                      {{ formatCurrency(deposit.total_allocated || '0') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-separator class="q-my-sm" />

                <q-item>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">
                      {{ $t('ar.deposit.balance') }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label
                      class="text-weight-bold"
                      :class="{
                        'text-positive': parseFloat(deposit.balance) > 0,
                        'text-grey-6': parseFloat(deposit.balance) === 0,
                      }"
                    >
                      {{ formatCurrency(deposit.balance) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <q-separator />

              <!-- Dates -->
              <div class="q-mt-md">
                <div class="text-caption text-grey-7 q-mb-xs">
                  {{ $t('ar.deposit.created_at') }}
                </div>
                <div class="text-body2">{{ formatDate(deposit.created_at) }}</div>

                <div v-if="deposit.refunded_at" class="text-caption text-grey-7 q-mb-xs q-mt-sm">
                  {{ $t('ar.deposit.refunded_at') }}
                </div>
                <div v-if="deposit.refunded_at" class="text-body2">
                  {{ formatDate(deposit.refunded_at) }}
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
      <div class="text-h6 q-mt-md">{{ $t('ar.deposit.not_found') }}</div>
    </div>

    <!-- Allocate Dialog -->
    <q-dialog v-model="showAllocateDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ $t('ar.deposit.actions.allocate') }}</div>
        </q-card-section>

        <q-card-section>
          <q-select
            v-model="allocationForm.invoice_id"
            :options="invoiceOptions"
            :label="$t('ar.invoice.title')"
            option-value="id"
            option-label="invoice_no"
            emit-value
            map-options
            outlined
            :loading="loadingInvoices"
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.invoice_no }}</q-item-label>
                  <q-item-label caption>
                    {{ $t('ar.invoice.open_amount') }}: {{ formatCurrency(scope.opt.open_amount) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-input
            v-model.number="allocationForm.amount"
            :label="$t('ar.deposit.allocate_amount')"
            type="number"
            step="0.01"
            min="0"
            :max="maxAllocationAmount"
            outlined
            class="q-mt-md"
            :rules="[
              (val) => !!val || $t('ar.validation.required'),
              (val) => val > 0 || $t('ar.validation.invalid_amount'),
              (val) => {
                const max = maxAllocationAmount;
                return val <= max || $t('ar.validation.amount_exceeds_balance');
              },
            ]"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('ar.common.cancel')" @click="showAllocateDialog = false" />
          <q-btn
            unelevated
            color="primary"
            :label="$t('ar.common.save')"
            :loading="allocating"
            @click="handleAllocate"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Dialog, type QTableProps } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { CustomerDeposit } from '@/types/ar/deposit';
import type { AllocateDepositPayload } from '@/types/ar/deposit';
import { canAllocateDeposit, canRefundDeposit } from '@/types/ar/deposit';
import { formatCurrency, formatDate } from '@/types/ar/common';
import {
  getDepositById,
  allocateDeposit,
  refundDeposit,
} from '@/services/ar/depositService';
import { getInvoices } from '@/services/ar/invoiceService';
import type { Invoice } from '@/types/ar/invoice';
import { useNotifier } from '@/composables/useNotifier';
import DepositStatusBadge from '@/components/ar/DepositStatusBadge.vue';
import PaymentMethodBadge from '@/components/ar/PaymentMethodBadge.vue';
import { printHtml, generateDepositHtml } from '@/utils/print';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const { success: notifySuccess, error: notifyError } = useNotifier();

// State
const deposit = ref<CustomerDeposit | null>(null);
const loading = ref(false);
const showAllocateDialog = ref(false);
const allocating = ref(false);
const loadingInvoices = ref(false);
const invoiceOptions = ref<Array<{ id: number; invoice_no: string; open_amount: string }>>([]);

const allocationForm = ref<AllocateDepositPayload>({
  invoice_id: 0,
  amount: 0,
});

// Computed
const depositId = computed(() => {
  const id = route.params.id;
  return typeof id === 'string' ? parseInt(id, 10) : 0;
});

const canAllocate = computed(() => deposit.value ? canAllocateDeposit(deposit.value) : false);
const canRefund = computed(() => deposit.value ? canRefundDeposit(deposit.value) : false);

const maxAllocationAmount = computed(() => {
  if (!deposit.value) return 0;
  const balance = parseFloat(deposit.value.balance);
  if (!allocationForm.value.invoice_id) return balance;

  const selectedInvoice = invoiceOptions.value.find(
    (inv) => inv.id === allocationForm.value.invoice_id,
  );
  if (!selectedInvoice) return balance;

  const invoiceOpen = parseFloat(selectedInvoice.open_amount);
  return Math.min(balance, invoiceOpen);
});

// Table columns for allocations
const allocationColumns = computed<QTableProps['columns']>(() => [
  {
    name: 'invoice',
    label: t('ar.invoice.title'),
    field: (row) => row.invoice?.invoice_no,
    align: 'left' as const,
  },
  {
    name: 'allocated_amount',
    label: t('ar.deposit.allocated_amount'),
    field: 'allocated_amount',
    align: 'right' as const,
  },
  {
    name: 'created_at',
    label: t('ar.deposit.created_at'),
    field: 'created_at',
    align: 'left' as const,
  },
]);

// Load deposit
const loadDeposit = async () => {
  loading.value = true;
  try {
    deposit.value = await getDepositById(depositId.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : t('ar.deposit.load_error');
    notifyError({ message });
    deposit.value = null;
  } finally {
    loading.value = false;
  }
};

// Load invoices for allocation
const loadInvoices = async () => {
  if (!deposit.value) return;

  loadingInvoices.value = true;
  try {
    const response = await getInvoices({
      customer_id: deposit.value.customer.id,
      has_balance: true,
      status: ['issued', 'partially_paid', 'overdue'],
      per_page: 100,
    });

    invoiceOptions.value = response.data.map((inv: Invoice) => ({
      id: inv.id,
      invoice_no: inv.invoice_no,
      open_amount: inv.open_amount,
    }));
  } catch (error) {
    console.error('Failed to load invoices:', error);
    invoiceOptions.value = [];
  } finally {
    loadingInvoices.value = false;
  }
};

// Watch for allocate dialog
watch(showAllocateDialog, (show) => {
  if (show && deposit.value) {
    allocationForm.value = {
      invoice_id: 0,
      amount: 0,
    };
    void loadInvoices();
  }
});

// Actions
const goBack = () => {
  void router.push({ name: 'ar-deposits' });
};

const openAllocateDialog = () => {
  showAllocateDialog.value = true;
};

const handleAllocate = async () => {
  if (!deposit.value || !allocationForm.value.invoice_id || allocationForm.value.amount <= 0) {
    return;
  }

  allocating.value = true;
  try {
    await allocateDeposit(deposit.value.id, allocationForm.value);
    notifySuccess({ message: t('ar.deposit.messages.allocate_success') });
    showAllocateDialog.value = false;
    await loadDeposit();
  } catch (error) {
    const message = error instanceof Error ? error.message : t('ar.deposit.allocate_error');
    notifyError({ message });
  } finally {
    allocating.value = false;
  }
};

const handleRefund = () => {
  if (!deposit.value) return;

  Dialog.create({
    title: t('ar.deposit.actions.refund'),
    message: t('ar.deposit.messages.confirm_refund', { amount: formatCurrency(deposit.value.balance) }),
    cancel: true,
    persistent: true,
    prompt: {
      model: parseFloat(deposit.value.balance).toString(),
      type: 'number',
      label: t('ar.deposit.refund_amount'),
      isValid: (val) => {
        const amount = parseFloat(val);
        return amount > 0 && amount <= parseFloat(deposit.value!.balance);
      },
    },
  }).onOk((data) => {
    void (async () => {
      if (!deposit.value) return;
      try {
        const refundAmount = parseFloat(data);
        await refundDeposit(deposit.value.id, {
          amount: refundAmount,
          note: null,
        });
        notifySuccess({ message: t('ar.deposit.messages.refund_success') });
        await loadDeposit();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.deposit.refund_error');
        notifyError({ message });
      }
    })();
  });
};

const handlePrint = () => {
  if (!deposit.value) return;
  const html = generateDepositHtml(deposit.value);
  printHtml(html, `Deposit_${deposit.value.deposit_no}`);
};

onMounted(() => {
  void loadDeposit();
});
</script>


<template>
  <q-page padding>
    <q-card flat bordered>
      <!-- Header -->
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">{{ $t('ar.deposit.list') }}</div>
          <div class="text-subtitle2 text-grey-7">
            {{ $t('ar.deposit.manage_deposits') }}
          </div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn
            color="primary"
            icon="add"
            :label="$t('ar.deposit.create')"
            @click="openCreateDialog"
          />
          <q-btn
            flat
            color="primary"
            icon="refresh"
            :label="$t('ar.common.refresh')"
            :loading="loading"
            @click="refresh"
          />
          <q-btn
            flat
            color="primary"
            icon="download"
            :label="$t('ar.common.export')"
            :disable="rows.length === 0"
            @click="handleExport"
          />
        </div>
      </q-card-section>

      <q-separator />

      <!-- Filters -->
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <q-input
              v-model="filters.deposit_no"
              :label="$t('ar.deposit.deposit_no')"
              outlined
              dense
              clearable
              debounce="400"
            >
              <template #append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.status"
              :options="statusOptions"
              :label="$t('ar.common.status')"
              emit-value
              map-options
              outlined
              dense
              clearable
              multiple
            />
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.payment_method"
              :options="paymentMethodOptions"
              :label="$t('ar.deposit.payment_method')"
              emit-value
              map-options
              outlined
              dense
              clearable
            />
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.has_balance"
              :options="balanceOptions"
              :label="$t('ar.deposit.balance_status')"
              emit-value
              map-options
              outlined
              dense
              clearable
            />
          </div>

          <div class="col-12 col-md-3">
            <q-input
              v-model="filters.date_from"
              :label="$t('ar.common.date_from')"
              type="date"
              outlined
              dense
              clearable
            />
          </div>

          <div class="col-12 col-md-3">
            <q-input
              v-model="filters.date_to"
              :label="$t('ar.common.date_to')"
              type="date"
              outlined
              dense
              clearable
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Table -->
      <q-table
        flat
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 50]"
        @request="onRequest"
      >
        <!-- Status Badge -->
        <template #body-cell-status="props">
          <q-td :props="props">
            <deposit-status-badge :status="props.row.status" />
          </q-td>
        </template>

        <!-- Customer -->
        <template #body-cell-customer="props">
          <q-td :props="props">
            <div class="text-weight-medium">{{ props.row.customer.name }}</div>
            <div class="text-caption text-grey-7">{{ props.row.customer.code }}</div>
          </q-td>
        </template>

        <!-- Payment Method -->
        <template #body-cell-payment_method="props">
          <q-td :props="props">
            <payment-method-badge :payment-method="props.row.payment_method" />
          </q-td>
        </template>

        <!-- Amounts -->
        <template #body-cell-amount="props">
          <q-td :props="props" class="text-right">
            <div class="text-weight-medium">{{ formatCurrency(props.row.amount) }}</div>
          </q-td>
        </template>

        <template #body-cell-balance="props">
          <q-td :props="props" class="text-right">
            <div
              class="text-weight-medium"
              :class="{
                'text-positive': parseFloat(props.row.balance) > 0,
                'text-grey-6': parseFloat(props.row.balance) === 0,
              }"
            >
              {{ formatCurrency(props.row.balance) }}
            </div>
          </q-td>
        </template>

        <template #body-cell-total_allocated="props">
          <q-td :props="props" class="text-right">
            <div class="text-body2">{{ formatCurrency(props.row.total_allocated || '0') }}</div>
          </q-td>
        </template>

        <!-- Date -->
        <template #body-cell-deposit_date="props">
          <q-td :props="props">
            {{ formatDate(props.row.deposit_date) }}
          </q-td>
        </template>

        <!-- Actions -->
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn dense flat round icon="more_vert" color="grey-7">
              <q-menu>
                <q-list style="min-width: 160px">
                  <q-item clickable v-close-popup @click="viewDeposit(props.row.id)">
                    <q-item-section avatar>
                      <q-icon name="visibility" color="grey-7" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ $t('ar.common.view') }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    v-if="canEdit(props.row)"
                    clickable
                    v-close-popup
                    @click="openEditDialog(props.row)"
                  >
                    <q-item-section avatar>
                      <q-icon name="edit" color="primary" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ $t('ar.common.edit') }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    v-if="canAllocate(props.row)"
                    clickable
                    v-close-popup
                    @click="handleAllocate(props.row)"
                  >
                    <q-item-section avatar>
                      <q-icon name="account_balance_wallet" color="positive" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ $t('ar.deposit.actions.allocate') }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    v-if="canRefund(props.row)"
                    clickable
                    v-close-popup
                    @click="handleRefund(props.row)"
                  >
                    <q-item-section avatar>
                      <q-icon name="undo" color="warning" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ $t('ar.deposit.actions.refund') }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-separator v-if="canDelete(props.row)" />

                  <q-item
                    v-if="canDelete(props.row)"
                    clickable
                    v-close-popup
                    @click="confirmDelete(props.row)"
                  >
                    <q-item-section avatar>
                      <q-icon name="delete" color="negative" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ $t('ar.common.delete') }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-td>
        </template>

        <!-- No data -->
        <template #no-data>
          <div class="text-center q-pa-lg column items-center">
            <q-icon name="savings" size="64px" color="grey-5" />
            <div class="text-subtitle1">{{ $t('ar.deposit.no_data') }}</div>
            <div class="text-body2 text-grey-6">
              {{ $t('ar.deposit.click_create') }}
            </div>
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- Create/Edit Dialog -->
    <deposit-form-dialog
      v-model="showDialog"
      :deposit="editingDeposit"
      @saved="onDepositSaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Dialog, type QTableProps } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { CustomerDeposit, DepositQueryParams } from '@/types/ar/deposit';
import type { DepositStatus } from '@/types/ar/common';
import {
  canAllocateDeposit,
  canRefundDeposit,
} from '@/types/ar/deposit';
import { formatCurrency, formatDate } from '@/types/ar/common';
import {
  getDeposits,
  deleteDeposit,
  refundDeposit as refundDepositApi,
} from '@/services/ar/depositService';
import { useNotifier } from '@/composables/useNotifier';
import DepositStatusBadge from '@/components/ar/DepositStatusBadge.vue';
import PaymentMethodBadge from '@/components/ar/PaymentMethodBadge.vue';
import DepositFormDialog from './DepositFormDialog.vue';
import { exportDepositsToCsv } from '@/utils/export';

const router = useRouter();
const { t } = useI18n();
const { success: notifySuccess, error: notifyError } = useNotifier();

// State
const rows = ref<CustomerDeposit[]>([]);
const loading = ref(false);
const showDialog = ref(false);
const editingDeposit = ref<CustomerDeposit | null>(null);

const pagination = ref<QTableProps['pagination']>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'deposit_date',
  descending: true,
});

// Filters
const filters = ref<Partial<DepositQueryParams>>({
  deposit_no: '',
  status: [],
  date_from: '',
  date_to: '',
});

const statusOptions = computed(() => [
  { label: t('ar.deposit.status.active'), value: 'active' },
  { label: t('ar.deposit.status.allocated'), value: 'allocated' },
  { label: t('ar.deposit.status.refunded'), value: 'refunded' },
]);

const paymentMethodOptions = computed(() => [
  { label: t('ar.receipt.payment_methods.cash'), value: 'cash' },
  { label: t('ar.receipt.payment_methods.bank_transfer'), value: 'bank_transfer' },
  { label: t('ar.receipt.payment_methods.cheque'), value: 'cheque' },
  { label: t('ar.receipt.payment_methods.credit_card'), value: 'credit_card' },
  { label: t('ar.receipt.payment_methods.promissory_note'), value: 'promissory_note' },
]);

const balanceOptions = computed(() => [
  { label: t('ar.deposit.has_balance'), value: true },
  { label: t('ar.deposit.no_balance'), value: false },
]);

// Table columns
const columns = computed<QTableProps['columns']>(() => [
  {
    name: 'deposit_no',
    label: t('ar.deposit.deposit_no'),
    field: 'deposit_no',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'customer',
    label: t('ar.common.customer'),
    field: (row: CustomerDeposit) => row.customer.name,
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'deposit_date',
    label: t('ar.deposit.deposit_date'),
    field: 'deposit_date',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'amount',
    label: t('ar.deposit.amount'),
    field: 'amount',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'balance',
    label: t('ar.deposit.balance'),
    field: 'balance',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'total_allocated',
    label: t('ar.deposit.total_allocated'),
    field: 'total_allocated',
    align: 'right' as const,
    sortable: false,
  },
  {
    name: 'payment_method',
    label: t('ar.deposit.payment_method'),
    field: 'payment_method',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'status',
    label: t('ar.common.status'),
    field: 'status',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'actions',
    label: '',
    field: 'id',
    align: 'right' as const,
  },
]);

// Helper functions
const canEdit = (deposit: CustomerDeposit) => deposit.status === 'active';
const canAllocate = (deposit: CustomerDeposit) => canAllocateDeposit(deposit);
const canRefund = (deposit: CustomerDeposit) => canRefundDeposit(deposit);
const canDelete = (deposit: CustomerDeposit) => deposit.status === 'active' && parseFloat(deposit.balance) === parseFloat(deposit.amount);

// Load data
const performLoad = async () => {
  loading.value = true;
  try {
    const params: DepositQueryParams = {
      page: pagination.value?.page ?? 1,
      per_page: pagination.value?.rowsPerPage ?? 10,
      ...(pagination.value?.sortBy ? { sort: pagination.value.sortBy } : {}),
      ...(filters.value.deposit_no && { deposit_no: filters.value.deposit_no }),
      ...(filters.value.status &&
        filters.value.status.length > 0 && { status: filters.value.status as DepositStatus[] }),
      ...(filters.value.payment_method && { payment_method: filters.value.payment_method }),
      ...(filters.value.has_balance !== undefined && { has_balance: filters.value.has_balance }),
      ...(filters.value.date_from && { date_from: filters.value.date_from }),
      ...(filters.value.date_to && { date_to: filters.value.date_to }),
    };

    const response = await getDeposits(params);
    rows.value = response.data;
    pagination.value = {
      ...pagination.value,
      page: response.meta.current_page,
      rowsPerPage: response.meta.per_page,
      rowsNumber: response.meta.total,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : t('ar.deposit.load_error');
    notifyError({ message });
  } finally {
    loading.value = false;
  }
};

const refresh = async () => {
  await performLoad();
};

const onRequest: QTableProps['onRequest'] = ({ pagination: pag }) => {
  if (!pag) return;
  pagination.value = pag;
  void refresh();
};

// Watch filters
watch(
  filters,
  () => {
    pagination.value = {
      ...pagination.value,
      page: 1,
    };
    void refresh();
  },
  { deep: true },
);

// Actions
const viewDeposit = (id: number) => {
  void router.push({ name: 'ar-deposits-detail', params: { id } });
};

const openCreateDialog = () => {
  editingDeposit.value = null;
  showDialog.value = true;
};

const openEditDialog = (deposit: CustomerDeposit) => {
  editingDeposit.value = deposit;
  showDialog.value = true;
};

const onDepositSaved = () => {
  showDialog.value = false;
  editingDeposit.value = null;
  void refresh();
};

const handleAllocate = (deposit: CustomerDeposit) => {
  // Navigate to detail page where allocation can be done
  void router.push({ name: 'ar-deposits-detail', params: { id: deposit.id } });
};

const handleRefund = (deposit: CustomerDeposit) => {
  Dialog.create({
    title: t('ar.deposit.actions.refund'),
    message: t('ar.deposit.messages.confirm_refund', { amount: formatCurrency(deposit.balance) }),
    cancel: true,
    persistent: true,
    prompt: {
      model: parseFloat(deposit.balance).toString(),
      type: 'number',
      label: t('ar.deposit.refund_amount'),
      isValid: (val) => {
        const amount = parseFloat(val);
        return amount > 0 && amount <= parseFloat(deposit.balance);
      },
    },
  }).onOk((data) => {
    void (async () => {
      try {
        const refundAmount = parseFloat(data);
        await refundDepositApi(deposit.id, {
          amount: refundAmount,
          note: null,
        });
        notifySuccess({ message: t('ar.deposit.messages.refund_success') });
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.deposit.refund_error');
        notifyError({ message });
      }
    })();
  });
};

const confirmDelete = (deposit: CustomerDeposit) => {
  Dialog.create({
    title: t('ar.common.delete'),
    message: t('ar.deposit.messages.confirm_delete'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await deleteDeposit(deposit.id);
        notifySuccess({ message: t('ar.deposit.messages.delete_success') });
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.deposit.delete_error');
        notifyError({ message });
      }
    })();
  });
};

const handleExport = () => {
  exportDepositsToCsv(rows.value);
};

onMounted(() => {
  void refresh();
});
</script>


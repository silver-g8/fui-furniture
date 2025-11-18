<template>
  <q-page padding>
    <q-card flat bordered>
      <!-- Header -->
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">{{ $t('ar.receipt.list') }}</div>
          <div class="text-subtitle2 text-grey-7">
            {{ $t('ar.receipt.manage_receipts') }}
          </div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn
            color="primary"
            icon="add"
            :label="$t('ar.receipt.create')"
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
              v-model="filters.receipt_no"
              :label="$t('ar.receipt.receipt_no')"
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
              :label="$t('ar.receipt.payment_method')"
              emit-value
              map-options
              outlined
              dense
              clearable
            />
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.has_unallocated"
              :options="unallocatedOptions"
              :label="$t('ar.receipt.allocation_status')"
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
            <receipt-status-badge :status="props.row.status" />
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
            <div class="text-weight-medium">{{ formatCurrency(props.row.total_amount || props.row.amount || '0') }}</div>
          </q-td>
        </template>

        <template #body-cell-allocated_total="props">
          <q-td :props="props" class="text-right">
            <div class="text-weight-medium">{{ formatCurrency(props.row.allocated_total || '0') }}</div>
          </q-td>
        </template>

        <template #body-cell-unallocated_amount="props">
          <q-td :props="props" class="text-right">
            <div
              class="text-weight-medium"
              :class="{
                'text-warning': parseFloat(props.row.unallocated_amount || '0') > 0,
                'text-positive': parseFloat(props.row.unallocated_amount || '0') === 0,
              }"
            >
              {{ formatCurrency(props.row.unallocated_amount || '0') }}
            </div>
          </q-td>
        </template>

        <!-- Date -->
        <template #body-cell-receipt_date="props">
          <q-td :props="props">
            {{ formatDate(props.row.receipt_date) }}
          </q-td>
        </template>

        <!-- Actions -->
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn dense flat round icon="more_vert" color="grey-7">
              <q-menu>
                <q-list style="min-width: 160px">
                  <q-item clickable v-close-popup @click="viewReceipt(props.row.id)">
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
                    v-if="canPost(props.row)"
                    clickable
                    v-close-popup
                    @click="postReceipt(props.row)"
                  >
                    <q-item-section avatar>
                      <q-icon name="check_circle" color="positive" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ $t('ar.receipt.actions.post') }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    v-if="canCancel(props.row)"
                    clickable
                    v-close-popup
                    @click="cancelReceipt(props.row)"
                  >
                    <q-item-section avatar>
                      <q-icon name="cancel" color="negative" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ $t('ar.receipt.actions.cancel') }}</q-item-label>
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
            <q-icon name="receipt" size="64px" color="grey-5" />
            <div class="text-subtitle1">{{ $t('ar.receipt.no_data') }}</div>
            <div class="text-body2 text-grey-6">
              {{ $t('ar.receipt.click_create') }}
            </div>
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- Create/Edit Dialog -->
    <receipt-form-dialog
      v-model="showDialog"
      :receipt="editingReceipt"
      @saved="onReceiptSaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Dialog, type QTableProps } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Receipt, ReceiptQueryParams } from '@/types/ar/receipt';
import type { ReceiptStatus } from '@/types/ar/common';
import {
  canEditReceipt,
  canPostReceipt,
  canCancelReceipt,
} from '@/types/ar/receipt';
import { formatCurrency, formatDate, PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/types/ar/common';
import {
  getReceipts,
  postReceipt as postReceiptApi,
  cancelReceipt as cancelReceiptApi,
  deleteReceipt,
} from '@/services/ar/receiptService';
import { useNotifier } from '@/composables/useNotifier';
import ReceiptStatusBadge from '@/components/ar/ReceiptStatusBadge.vue';
import PaymentMethodBadge from '@/components/ar/PaymentMethodBadge.vue';
import { exportReceiptsToCsv } from '@/utils/export';
import ReceiptFormDialog from './ReceiptFormDialog.vue';

const router = useRouter();
const { t } = useI18n();
const { success: notifySuccess, error: notifyError } = useNotifier();

// State
const rows = ref<Receipt[]>([]);
const loading = ref(false);
const showDialog = ref(false);
const editingReceipt = ref<Receipt | null>(null);

const pagination = ref<QTableProps['pagination']>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'receipt_date',
  descending: true,
});

// Filters
const filters = ref<Partial<ReceiptQueryParams>>({
  receipt_no: '',
  status: [],
  date_from: '',
  date_to: '',
});

const statusOptions = computed(() => [
  { label: t('ar.receipt.status.draft'), value: 'draft' },
  { label: t('ar.receipt.status.posted'), value: 'posted' },
  { label: t('ar.receipt.status.cancelled'), value: 'cancelled' },
]);

// Use same payment methods as Cash Sale page
const paymentMethodOptions = computed(() => 
  Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
    label,
    value: value as PaymentMethod,
  }))
);

const unallocatedOptions = computed(() => [
  { label: t('ar.receipt.all_allocated'), value: false },
  { label: t('ar.receipt.has_unallocated'), value: true },
]);

// Table columns
const columns = computed<QTableProps['columns']>(() => [
  {
    name: 'receipt_no',
    label: t('ar.receipt.receipt_no'),
    field: 'receipt_no',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'customer',
    label: t('ar.common.customer'),
    field: (row: Receipt) => row.customer.name,
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'receipt_date',
    label: t('ar.receipt.receipt_date'),
    field: 'receipt_date',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'amount',
    label: t('ar.receipt.amount'),
    field: (row: Receipt) => row.total_amount || row.amount || '0',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'payment_method',
    label: t('ar.receipt.payment_method'),
    field: 'payment_method',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'allocated_total',
    label: t('ar.receipt.allocated_total'),
    field: 'allocated_total',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'unallocated_amount',
    label: t('ar.receipt.unallocated_amount'),
    field: 'unallocated_amount',
    align: 'right' as const,
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

// Load data
const performLoad = async () => {
  loading.value = true;
  try {
    const params: ReceiptQueryParams = {
      page: pagination.value?.page ?? 1,
      per_page: pagination.value?.rowsPerPage ?? 10,
      ...(pagination.value?.sortBy ? { sort: pagination.value.sortBy } : {}),
      ...(filters.value.receipt_no && { receipt_no: filters.value.receipt_no }),
      ...(filters.value.status &&
        filters.value.status.length > 0 && { status: filters.value.status as ReceiptStatus[] }),
      ...(filters.value.payment_method && { payment_method: filters.value.payment_method }),
      ...(filters.value.has_unallocated !== undefined && { has_unallocated: filters.value.has_unallocated }),
      ...(filters.value.date_from && { date_from: filters.value.date_from }),
      ...(filters.value.date_to && { date_to: filters.value.date_to }),
    };

    const response = await getReceipts(params);
    rows.value = response.data;
    pagination.value = {
      ...pagination.value,
      page: response.meta.current_page,
      rowsPerPage: response.meta.per_page,
      rowsNumber: response.meta.total,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : t('ar.receipt.load_error');
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

// Helper functions
const canEdit = (receipt: Receipt) => canEditReceipt(receipt);
const canPost = (receipt: Receipt) => canPostReceipt(receipt);
const canCancel = (receipt: Receipt) => canCancelReceipt(receipt);
const canDelete = (receipt: Receipt) => receipt.status === 'draft';

// Actions
const viewReceipt = (id: number) => {
  void router.push({ name: 'ar-receipts-detail', params: { id } });
};

const openCreateDialog = () => {
  editingReceipt.value = null;
  showDialog.value = true;
};

const openEditDialog = (receipt: Receipt) => {
  editingReceipt.value = receipt;
  showDialog.value = true;
};

const onReceiptSaved = () => {
  showDialog.value = false;
  editingReceipt.value = null;
  void refresh();
};

const postReceipt = (receipt: Receipt) => {
  Dialog.create({
    title: t('ar.receipt.actions.post'),
    message: t('ar.receipt.messages.confirm_post'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await postReceiptApi(receipt.id);
        notifySuccess({ message: t('ar.receipt.messages.post_success') });
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.receipt.post_error');
        notifyError({ message });
      }
    })();
  });
};

const cancelReceipt = (receipt: Receipt) => {
  Dialog.create({
    title: t('ar.receipt.actions.cancel'),
    message: t('ar.receipt.messages.confirm_cancel'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await cancelReceiptApi(receipt.id);
        notifySuccess({ message: t('ar.receipt.messages.cancel_success') });
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.receipt.cancel_error');
        notifyError({ message });
      }
    })();
  });
};

const confirmDelete = (receipt: Receipt) => {
  Dialog.create({
    title: t('ar.common.delete'),
    message: t('ar.receipt.messages.confirm_delete'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await deleteReceipt(receipt.id);
        notifySuccess({ message: t('ar.receipt.messages.delete_success') });
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.receipt.delete_error');
        notifyError({ message });
      }
    })();
  });
};

const handleExport = () => {
  exportReceiptsToCsv(rows.value);
};

onMounted(() => {
  void refresh();
});
</script>

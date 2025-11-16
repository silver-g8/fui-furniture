<template>
  <q-page padding>
    <q-card flat bordered>
      <!-- Header -->
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">{{ $t('ar.invoice.list') }}</div>
          <div class="text-subtitle2 text-grey-7">
            {{ $t('ar.invoice.manage_invoices') }}
          </div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn
            v-if="selected.length > 0"
            color="primary"
            icon="check"
            :label="$t('ar.bulk.issue_invoices')"
            outline
            @click="bulkIssue"
          />
          <q-btn
            color="primary"
            icon="add"
            :label="$t('ar.invoice.create')"
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
        </div>
      </q-card-section>

      <q-separator />

      <!-- Filters -->
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <q-input
              v-model="filters.invoice_no"
              :label="$t('ar.invoice.invoice_no')"
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
        v-model:selected="selected"
        selection="multiple"
        :rows-per-page-options="[10, 20, 50]"
        @request="onRequest"
      >
        <!-- Status Badge -->
        <template #body-cell-status="props">
          <q-td :props="props">
            <invoice-status-badge :status="props.row.status" />
          </q-td>
        </template>

        <!-- Customer -->
        <template #body-cell-customer="props">
          <q-td :props="props">
            <div class="text-weight-medium">{{ props.row.customer.name }}</div>
            <div class="text-caption text-grey-7">{{ props.row.customer.code }}</div>
          </q-td>
        </template>

        <!-- Amounts -->
        <template #body-cell-grand_total="props">
          <q-td :props="props" class="text-right">
            <div class="text-weight-medium">{{ formatCurrency(props.row.grand_total) }}</div>
          </q-td>
        </template>

        <template #body-cell-open_amount="props">
          <q-td :props="props" class="text-right">
            <div
              class="text-weight-medium"
              :class="{
                'text-negative': parseFloat(props.row.open_amount) > 0,
                'text-positive': parseFloat(props.row.open_amount) === 0,
              }"
            >
              {{ formatCurrency(props.row.open_amount) }}
            </div>
          </q-td>
        </template>

        <!-- Dates -->
        <template #body-cell-invoice_date="props">
          <q-td :props="props">
            {{ formatDate(props.row.invoice_date) }}
          </q-td>
        </template>

        <template #body-cell-due_date="props">
          <q-td :props="props">
            <div>{{ formatDate(props.row.due_date) }}</div>
            <div v-if="isOverdue(props.row)" class="text-caption text-negative">
              {{ $t('ar.invoice.overdue_days', { days: getDaysOverdue(props.row) }) }}
            </div>
          </q-td>
        </template>

        <!-- Actions -->
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn dense flat round icon="more_vert" color="grey-7">
              <q-menu>
                <q-list style="min-width: 160px">
                  <q-item clickable v-close-popup @click="viewInvoice(props.row.id)">
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
                    v-if="canIssue(props.row)"
                    clickable
                    v-close-popup
                    @click="issueInvoice(props.row)"
                  >
                    <q-item-section avatar>
                      <q-icon name="check_circle" color="positive" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ $t('ar.invoice.actions.issue') }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    v-if="canCancel(props.row)"
                    clickable
                    v-close-popup
                    @click="cancelInvoice(props.row)"
                  >
                    <q-item-section avatar>
                      <q-icon name="cancel" color="negative" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ $t('ar.invoice.actions.cancel') }}</q-item-label>
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
            <q-icon name="description" size="64px" color="grey-5" />
            <div class="text-subtitle1">{{ $t('ar.invoice.no_data') }}</div>
            <div class="text-body2 text-grey-6">
              {{ $t('ar.invoice.click_create') }}
            </div>
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- Create/Edit Dialog -->
    <invoice-form-dialog
      v-model="showDialog"
      :invoice="editingInvoice"
      @saved="onInvoiceSaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Dialog, type QTableProps } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Invoice, InvoiceQueryParams } from '@/types/ar/invoice';
import type { InvoiceStatus } from '@/types/ar/common';
import {
  canEditInvoice,
  canIssueInvoice,
  canCancelInvoice,
  isInvoiceOverdue,
  getDaysOverdue,
} from '@/types/ar/invoice';
import { formatCurrency, formatDate } from '@/types/ar/common';
import {
  getInvoices,
  issueInvoice as issueInvoiceApi,
  cancelInvoice as cancelInvoiceApi,
  deleteInvoice,
  bulkIssueInvoices,
} from '@/services/ar/invoiceService';
import { useNotifier } from '@/composables/useNotifier';
import InvoiceStatusBadge from '@/components/ar/InvoiceStatusBadge.vue';
import InvoiceFormDialog from './InvoiceFormDialog.vue';

const router = useRouter();
const { t } = useI18n();
const { success: notifySuccess, error: notifyError } = useNotifier();

// State
const rows = ref<Invoice[]>([]);
const loading = ref(false);
const selected = ref<Invoice[]>([]);
const showDialog = ref(false);
const editingInvoice = ref<Invoice | null>(null);

const pagination = ref<QTableProps['pagination']>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'invoice_date',
  descending: true,
});

// Filters
const filters = ref<Partial<InvoiceQueryParams>>({
  invoice_no: '',
  status: [],
  date_from: '',
  date_to: '',
});

const statusOptions = computed(() => [
  { label: t('ar.invoice.status.draft'), value: 'draft' },
  { label: t('ar.invoice.status.issued'), value: 'issued' },
  { label: t('ar.invoice.status.partially_paid'), value: 'partially_paid' },
  { label: t('ar.invoice.status.paid'), value: 'paid' },
  { label: t('ar.invoice.status.overdue'), value: 'overdue' },
  { label: t('ar.invoice.status.cancelled'), value: 'cancelled' },
]);

// Table columns
const columns = computed<QTableProps['columns']>(() => [
  {
    name: 'invoice_no',
    label: t('ar.invoice.invoice_no'),
    field: 'invoice_no',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'customer',
    label: t('ar.common.customer'),
    field: (row: Invoice) => row.customer.name,
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'invoice_date',
    label: t('ar.invoice.invoice_date'),
    field: 'invoice_date',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'due_date',
    label: t('ar.invoice.due_date'),
    field: 'due_date',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'grand_total',
    label: t('ar.invoice.grand_total'),
    field: 'grand_total',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'open_amount',
    label: t('ar.invoice.open_amount'),
    field: 'open_amount',
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
    const params: InvoiceQueryParams = {
      page: pagination.value?.page ?? 1,
      per_page: pagination.value?.rowsPerPage ?? 10,
      ...(pagination.value?.sortBy ? { sort: pagination.value.sortBy } : {}),
      ...(filters.value.invoice_no && { invoice_no: filters.value.invoice_no }),
      ...(filters.value.status &&
        filters.value.status.length > 0 && { status: filters.value.status as InvoiceStatus[] }),
      ...(filters.value.date_from && { date_from: filters.value.date_from }),
      ...(filters.value.date_to && { date_to: filters.value.date_to }),
    };

    const response = await getInvoices(params);
    rows.value = response.data;
    pagination.value = {
      ...pagination.value,
      page: response.meta.current_page,
      rowsPerPage: response.meta.per_page,
      rowsNumber: response.meta.total,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : t('ar.invoice.load_error');
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
const isOverdue = (invoice: Invoice) => isInvoiceOverdue(invoice);
const canEdit = (invoice: Invoice) => canEditInvoice(invoice);
const canIssue = (invoice: Invoice) => canIssueInvoice(invoice);
const canCancel = (invoice: Invoice) => canCancelInvoice(invoice);
const canDelete = (invoice: Invoice) => invoice.status === 'draft';

// Actions
const viewInvoice = (id: number) => {
  void router.push({ name: 'ar-invoices-detail', params: { id } });
};

const openCreateDialog = () => {
  editingInvoice.value = null;
  showDialog.value = true;
};

const openEditDialog = (invoice: Invoice) => {
  editingInvoice.value = invoice;
  showDialog.value = true;
};

const onInvoiceSaved = () => {
  showDialog.value = false;
  editingInvoice.value = null;
  void refresh();
};

const issueInvoice = (invoice: Invoice) => {
  Dialog.create({
    title: t('ar.invoice.actions.issue'),
    message: t('ar.invoice.messages.confirm_issue'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await issueInvoiceApi(invoice.id);
        notifySuccess({ message: t('ar.invoice.messages.issue_success') });
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.invoice.issue_error');
        notifyError({ message });
      }
    })();
  });
};

const cancelInvoice = (invoice: Invoice) => {
  Dialog.create({
    title: t('ar.invoice.actions.cancel'),
    message: t('ar.invoice.messages.confirm_cancel'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await cancelInvoiceApi(invoice.id);
        notifySuccess({ message: t('ar.invoice.messages.cancel_success') });
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.invoice.cancel_error');
        notifyError({ message });
      }
    })();
  });
};

const confirmDelete = (invoice: Invoice) => {
  Dialog.create({
    title: t('ar.common.delete'),
    message: t('ar.invoice.messages.confirm_delete'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await deleteInvoice(invoice.id);
        notifySuccess({ message: t('ar.invoice.messages.delete_success') });
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.invoice.delete_error');
        notifyError({ message });
      }
    })();
  });
};

const bulkIssue = () => {
  const ids = selected.value.map((inv) => inv.id);
  Dialog.create({
    title: t('ar.bulk.issue_invoices'),
    message: t('ar.bulk.confirm', { count: ids.length }),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        const result = await bulkIssueInvoices(ids);
        notifySuccess({
          message: t('ar.bulk.success', { success: result.results.success }),
        });
        selected.value = [];
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.bulk.error');
        notifyError({ message });
      }
    })();
  });
};

onMounted(() => {
  void refresh();
});
</script>

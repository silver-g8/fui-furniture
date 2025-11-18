<template>
  <q-page padding>
    <q-card flat bordered>
      <!-- Header -->
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">{{ $t('ar.credit_note.list') }}</div>
          <div class="text-subtitle2 text-grey-7">
            {{ $t('ar.credit_note.manage_credit_notes') }}
          </div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn
            color="primary"
            icon="add"
            :label="$t('ar.credit_note.create')"
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
              v-model="filters.credit_note_no"
              :label="$t('ar.credit_note.credit_note_no')"
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
              v-model="filters.type"
              :options="typeOptions"
              :label="$t('ar.credit_note.type')"
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
        :rows-per-page-options="[10, 20, 50]"
        @request="onRequest"
      >
        <!-- Status Badge -->
        <template #body-cell-status="props">
          <q-td :props="props">
            <credit-note-status-badge :status="props.row.status" />
          </q-td>
        </template>

        <!-- Type Badge -->
        <template #body-cell-type="props">
          <q-td :props="props">
            <q-chip
              :color="getTypeColor(props.row.type)"
              text-color="white"
              dense
              size="sm"
            >
              {{ $t(`ar.credit_note.types.${props.row.type}`) }}
            </q-chip>
          </q-td>
        </template>

        <!-- Customer -->
        <template #body-cell-customer="props">
          <q-td :props="props">
            <div class="text-weight-medium">{{ props.row.customer.name }}</div>
            <div class="text-caption text-grey-7">{{ props.row.customer.code }}</div>
          </q-td>
        </template>

        <!-- Invoice -->
        <template #body-cell-invoice="props">
          <q-td :props="props">
            <div v-if="props.row.invoice" class="text-weight-medium">
              {{ props.row.invoice.invoice_no }}
            </div>
            <div v-else class="text-grey-6">-</div>
          </q-td>
        </template>

        <!-- Amount -->
        <template #body-cell-amount="props">
          <q-td :props="props" class="text-right">
            <div class="text-weight-medium text-negative">
              {{ formatCurrency(props.row.amount) }}
            </div>
          </q-td>
        </template>

        <!-- Date -->
        <template #body-cell-issue_date="props">
          <q-td :props="props">
            {{ formatDate(props.row.issue_date) }}
          </q-td>
        </template>

        <!-- Actions -->
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn dense flat round icon="more_vert" color="grey-7">
              <q-menu>
                <q-list style="min-width: 160px">
                  <q-item clickable v-close-popup @click="viewCreditNote(props.row.id)">
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
                    @click="issueCreditNote(props.row)"
                  >
                    <q-item-section avatar>
                      <q-icon name="check_circle" color="positive" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ $t('ar.credit_note.actions.issue') }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    v-if="canCancel(props.row)"
                    clickable
                    v-close-popup
                    @click="cancelCreditNote(props.row)"
                  >
                    <q-item-section avatar>
                      <q-icon name="cancel" color="negative" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ $t('ar.credit_note.actions.cancel') }}</q-item-label>
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
            <q-icon name="note" size="64px" color="grey-5" />
            <div class="text-subtitle1">{{ $t('ar.credit_note.no_data') }}</div>
            <div class="text-body2 text-grey-6">
              {{ $t('ar.credit_note.click_create') }}
            </div>
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- Create/Edit Dialog -->
    <credit-note-form-dialog
      v-model="showDialog"
      :credit-note="editingCreditNote"
      @saved="onCreditNoteSaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Dialog, type QTableProps } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { CreditNote, CreditNoteQueryParams } from '@/types/ar/creditNote';
import type { CreditNoteType } from '@/types/ar/creditNote';
import type { CreditNoteStatus } from '@/types/ar/common';
import {
  canEditCreditNote,
  canIssueCreditNote,
  canCancelCreditNote,
} from '@/types/ar/creditNote';
import { formatCurrency, formatDate } from '@/types/ar/common';
import {
  getCreditNotes,
  issueCreditNote as issueCreditNoteApi,
  cancelCreditNote as cancelCreditNoteApi,
  deleteCreditNote,
} from '@/services/ar/creditNoteService';
import { useNotifier } from '@/composables/useNotifier';
import CreditNoteStatusBadge from '@/components/ar/CreditNoteStatusBadge.vue';
import CreditNoteFormDialog from './CreditNoteFormDialog.vue';
import { CREDIT_NOTE_TYPE_COLORS } from '@/types/ar/creditNote';
import { exportCreditNotesToCsv } from '@/utils/export';

const router = useRouter();
const { t } = useI18n();
const { success: notifySuccess, error: notifyError } = useNotifier();

// State
const rows = ref<CreditNote[]>([]);
const loading = ref(false);
const showDialog = ref(false);
const editingCreditNote = ref<CreditNote | null>(null);

const pagination = ref<QTableProps['pagination']>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'issue_date',
  descending: true,
});

// Filters
const filters = ref<Partial<CreditNoteQueryParams>>({
  credit_note_no: '',
  status: [],
  type: [],
  date_from: '',
  date_to: '',
});

const statusOptions = computed(() => [
  { label: t('ar.credit_note.status.draft'), value: 'draft' },
  { label: t('ar.credit_note.status.issued'), value: 'issued' },
  { label: t('ar.credit_note.status.cancelled'), value: 'cancelled' },
]);

const typeOptions = computed(() => [
  { label: t('ar.credit_note.types.return'), value: 'return' },
  { label: t('ar.credit_note.types.discount'), value: 'discount' },
  { label: t('ar.credit_note.types.adjustment'), value: 'adjustment' },
]);

// Table columns
const columns = computed<QTableProps['columns']>(() => [
  {
    name: 'credit_note_no',
    label: t('ar.credit_note.credit_note_no'),
    field: 'credit_note_no',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'customer',
    label: t('ar.common.customer'),
    field: (row: CreditNote) => row.customer.name,
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'invoice',
    label: t('ar.invoice.title'),
    field: (row: CreditNote) => row.invoice?.invoice_no,
    align: 'left' as const,
    sortable: false,
  },
  {
    name: 'type',
    label: t('ar.credit_note.type'),
    field: 'type',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'amount',
    label: t('ar.credit_note.amount'),
    field: 'amount',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'issue_date',
    label: t('ar.credit_note.issue_date'),
    field: 'issue_date',
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
const getTypeColor = (type: CreditNoteType): string => {
  return CREDIT_NOTE_TYPE_COLORS[type] || 'grey';
};

const canEdit = (creditNote: CreditNote) => canEditCreditNote(creditNote);
const canIssue = (creditNote: CreditNote) => canIssueCreditNote(creditNote);
const canCancel = (creditNote: CreditNote) => canCancelCreditNote(creditNote);
const canDelete = (creditNote: CreditNote) => creditNote.status === 'draft';

// Load data
const performLoad = async () => {
  loading.value = true;
  try {
    const params: CreditNoteQueryParams = {
      page: pagination.value?.page ?? 1,
      per_page: pagination.value?.rowsPerPage ?? 10,
      ...(pagination.value?.sortBy ? { sort: pagination.value.sortBy } : {}),
      ...(filters.value.credit_note_no && { credit_note_no: filters.value.credit_note_no }),
      ...(filters.value.status &&
        filters.value.status.length > 0 && { status: filters.value.status as CreditNoteStatus[] }),
      ...(filters.value.type &&
        filters.value.type.length > 0 && { type: filters.value.type as CreditNoteType[] }),
      ...(filters.value.date_from && { date_from: filters.value.date_from }),
      ...(filters.value.date_to && { date_to: filters.value.date_to }),
    };

    const response = await getCreditNotes(params);
    rows.value = response.data;
    pagination.value = {
      ...pagination.value,
      page: response.meta.current_page,
      rowsPerPage: response.meta.per_page,
      rowsNumber: response.meta.total,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : t('ar.credit_note.load_error');
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
const viewCreditNote = (id: number) => {
  void router.push({ name: 'ar-credit-notes-detail', params: { id } });
};

const openCreateDialog = () => {
  editingCreditNote.value = null;
  showDialog.value = true;
};

const openEditDialog = (creditNote: CreditNote) => {
  editingCreditNote.value = creditNote;
  showDialog.value = true;
};

const onCreditNoteSaved = () => {
  showDialog.value = false;
  editingCreditNote.value = null;
  void refresh();
};

const issueCreditNote = (creditNote: CreditNote) => {
  Dialog.create({
    title: t('ar.credit_note.actions.issue'),
    message: t('ar.credit_note.messages.confirm_issue'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await issueCreditNoteApi(creditNote.id);
        notifySuccess({ message: t('ar.credit_note.messages.issue_success') });
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.credit_note.issue_error');
        notifyError({ message });
      }
    })();
  });
};

const cancelCreditNote = (creditNote: CreditNote) => {
  Dialog.create({
    title: t('ar.credit_note.actions.cancel'),
    message: t('ar.credit_note.messages.confirm_cancel'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await cancelCreditNoteApi(creditNote.id);
        notifySuccess({ message: t('ar.credit_note.messages.cancel_success') });
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.credit_note.cancel_error');
        notifyError({ message });
      }
    })();
  });
};

const confirmDelete = (creditNote: CreditNote) => {
  Dialog.create({
    title: t('ar.common.delete'),
    message: t('ar.credit_note.messages.confirm_delete'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await deleteCreditNote(creditNote.id);
        notifySuccess({ message: t('ar.credit_note.messages.delete_success') });
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('ar.credit_note.delete_error');
        notifyError({ message });
      }
    })();
  });
};

const handleExport = () => {
  exportCreditNotesToCsv(rows.value);
};

onMounted(() => {
  void refresh();
});
</script>


<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">ใบเสนอราคา</div>
          <div class="text-subtitle2 text-grey-7">จัดการใบเสนอราคา (สร้าง / แก้ไข / อนุมัติ)</div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn color="primary" icon="add" label="สร้างใบเสนอราคา" @click="goToCreate" />
          <q-btn
            flat
            color="primary"
            icon="refresh"
            label="รีเฟรช"
            :loading="store.loading"
            @click="refresh"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <q-select
              v-model="statusFilter"
              :options="statusOptions"
              emit-value
              map-options
              outlined
              dense
              clearable
              label="สถานะ"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="dateFrom"
              label="วันที่เริ่มต้น"
              outlined
              dense
              type="date"
              clearable
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="dateTo"
              label="วันที่สิ้นสุด"
              outlined
              dense
              type="date"
              clearable
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-table
        flat
        bordered
        :rows="store.items"
        :columns="columns"
        row-key="id"
        :loading="store.loading"
        v-model:pagination="tablePagination"
        :rows-per-page-options="[10, 20, 50]"
        @request="onRequest"
      >
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="getStatusColor(props.value)">
              {{ getStatusLabel(props.value) }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-grand_total="props">
          <q-td :props="props" class="text-right text-weight-medium">
            {{ formatCurrency(props.value) }}
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn dense flat round icon="more_vert" color="grey-7">
              <q-menu>
                <q-list style="min-width: 160px">
                  <q-item clickable v-close-popup @click="viewQuotation(props.row.id)">
                    <q-item-section avatar>
                      <q-icon name="visibility" />
                    </q-item-section>
                    <q-item-section>ดูรายละเอียด</q-item-section>
                  </q-item>
                  <q-item
                    v-if="props.row.status === 'draft'"
                    clickable
                    v-close-popup
                    @click="editQuotation(props.row.id)"
                  >
                    <q-item-section avatar>
                      <q-icon name="edit" />
                    </q-item-section>
                    <q-item-section>แก้ไข</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { QTableProps } from 'quasar';
import { useQuotationStore } from '@/stores/sales/useQuotationStore';
import type { QuotationStatus, QuotationListParams } from '@/types/sales';
import { formatCurrency } from '@/types/ar/common';

const router = useRouter();
const store = useQuotationStore();

const statusFilter = ref<QuotationStatus | null>(null);
const dateFrom = ref<string | null>(null);
const dateTo = ref<string | null>(null);

const statusOptions = [
  { label: 'ร่าง', value: 'draft' },
  { label: 'รออนุมัติ', value: 'waiting' },
  { label: 'อนุมัติแล้ว', value: 'approved' },
  { label: 'ปฏิเสธ', value: 'rejected' },
];

const tablePagination = ref<QTableProps['pagination']>({
  page: 1,
  rowsPerPage: 15,
  rowsNumber: 0,
});

const columns: QTableProps['columns'] = [
  {
    name: 'quotation_no',
    label: 'เลขที่',
    field: 'quotation_no',
    align: 'left',
    sortable: true,
  },
  {
    name: 'customer',
    label: 'ลูกค้า',
    field: (row) => row.customer?.name || '-',
    align: 'left',
  },
  {
    name: 'quotation_date',
    label: 'วันที่',
    field: 'quotation_date',
    align: 'center',
    format: (val) => new Date(val).toLocaleDateString('th-TH'),
  },
  {
    name: 'expiry_date',
    label: 'วันหมดอายุ',
    field: 'expiry_date',
    align: 'center',
    format: (val) => (val ? new Date(val).toLocaleDateString('th-TH') : '-'),
  },
  {
    name: 'status',
    label: 'สถานะ',
    field: 'status',
    align: 'center',
  },
  {
    name: 'grand_total',
    label: 'ยอดรวม',
    field: 'grand_total',
    align: 'right',
  },
  {
    name: 'actions',
    label: '',
    field: '',
    align: 'center',
  },
];

const getStatusColor = (status: QuotationStatus): string => {
  const colors: Record<QuotationStatus, string> = {
    draft: 'grey',
    waiting: 'orange',
    approved: 'positive',
    rejected: 'negative',
  };
  return colors[status] || 'grey';
};

const getStatusLabel = (status: QuotationStatus): string => {
  const labels: Record<QuotationStatus, string> = {
    draft: 'ร่าง',
    waiting: 'รออนุมัติ',
    approved: 'อนุมัติแล้ว',
    rejected: 'ปฏิเสธ',
  };
  return labels[status] || status;
};

const refresh = async () => {
  await loadData();
};

const loadData = async () => {
  const params: QuotationListParams = {
    page: tablePagination.value?.page || 1,
    per_page: tablePagination.value?.rowsPerPage || 15,
  };
  if (statusFilter.value) {
    params.status = statusFilter.value;
  }
  if (dateFrom.value) {
    params.date_from = dateFrom.value;
  }
  if (dateTo.value) {
    params.date_to = dateTo.value;
  }
  await store.load(params);
  if (tablePagination.value) {
    tablePagination.value.rowsNumber = store.pagination.total;
  }
};

const onRequest: QTableProps['onRequest'] = ({ pagination }) => {
  if (pagination) {
    tablePagination.value = pagination;
    void loadData();
  }
};

const goToCreate = () => {
  void router.push({ name: 'sales-quotations-create' });
};

const viewQuotation = (id: number) => {
  void router.push({ name: 'sales-quotations-detail', params: { id } });
};

const editQuotation = (id: number) => {
  void router.push({ name: 'sales-quotations-edit', params: { id } });
};

watch([statusFilter, dateFrom, dateTo], () => {
  if (tablePagination.value) {
    tablePagination.value.page = 1;
  }
  void loadData();
});

onMounted(() => {
  void loadData();
});
</script>


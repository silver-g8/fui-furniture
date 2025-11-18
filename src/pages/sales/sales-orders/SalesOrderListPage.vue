<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">คำสั่งขาย</div>
          <div class="text-subtitle2 text-grey-7">จัดการคำสั่งขาย (สร้าง / แก้ไข / ยืนยัน)</div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn color="primary" icon="add" label="สร้างคำสั่งขาย" @click="goToCreate" />
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

        <template #body-cell-total_amount="props">
          <q-td :props="props" class="text-right text-weight-medium">
            {{ formatCurrency(props.value) }}
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn dense flat round icon="more_vert" color="grey-7">
              <q-menu>
                <q-list style="min-width: 160px">
                  <q-item clickable v-close-popup @click="viewSalesOrder(props.row.id)">
                    <q-item-section avatar>
                      <q-icon name="visibility" />
                    </q-item-section>
                    <q-item-section>ดูรายละเอียด</q-item-section>
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
import { useSalesOrderStore } from '@/stores/sales/useSalesOrderStore';
import type { SalesOrderStatus, SalesOrderListParams } from '@/types/sales';
import { formatCurrency } from '@/types/ar/common';

const router = useRouter();
const store = useSalesOrderStore();

const statusFilter = ref<SalesOrderStatus | null>(null);

const statusOptions = [
  { label: 'ร่าง', value: 'draft' },
  { label: 'ยืนยันแล้ว', value: 'confirmed' },
  { label: 'จองแล้ว', value: 'reserved' },
  { label: 'กำลังจัดเตรียม', value: 'picking' },
  { label: 'กำลังจัดส่ง', value: 'shipping' },
  { label: 'จัดส่งแล้ว', value: 'delivered' },
  { label: 'เสร็จสมบูรณ์', value: 'completed' },
  { label: 'ยกเลิก', value: 'cancelled' },
];

const tablePagination = ref<QTableProps['pagination']>({
  page: 1,
  rowsPerPage: 15,
  rowsNumber: 0,
});

const columns: QTableProps['columns'] = [
  {
    name: 'sales_order_no',
    label: 'เลขที่',
    field: 'sales_order_no',
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
    name: 'status',
    label: 'สถานะ',
    field: 'status',
    align: 'center',
  },
  {
    name: 'total_amount',
    label: 'ยอดรวม',
    field: 'total_amount',
    align: 'right',
  },
  {
    name: 'actions',
    label: '',
    field: '',
    align: 'center',
  },
];

const getStatusColor = (status: SalesOrderStatus): string => {
  const colors: Record<SalesOrderStatus, string> = {
    draft: 'grey',
    confirmed: 'blue',
    reserved: 'orange',
    picking: 'purple',
    shipping: 'indigo',
    partially_delivered: 'warning',
    delivered: 'positive',
    completed: 'positive',
    cancelled: 'negative',
  };
  return colors[status] || 'grey';
};

const getStatusLabel = (status: SalesOrderStatus): string => {
  const labels: Record<SalesOrderStatus, string> = {
    draft: 'ร่าง',
    confirmed: 'ยืนยันแล้ว',
    reserved: 'จองแล้ว',
    picking: 'กำลังจัดเตรียม',
    shipping: 'กำลังจัดส่ง',
    partially_delivered: 'จัดส่งบางส่วน',
    delivered: 'จัดส่งแล้ว',
    completed: 'เสร็จสมบูรณ์',
    cancelled: 'ยกเลิก',
  };
  return labels[status] || status;
};

const refresh = async () => {
  await loadData();
};

const loadData = async () => {
  const params: SalesOrderListParams = {
    page: tablePagination.value?.page || 1,
    per_page: tablePagination.value?.rowsPerPage || 15,
  };
  if (statusFilter.value) {
    params.status = statusFilter.value;
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
  void router.push({ name: 'sales-orders-create' });
};

const viewSalesOrder = (id: number) => {
  void router.push({ name: 'sales-orders-detail', params: { id } });
};

watch([statusFilter], () => {
  if (tablePagination.value) {
    tablePagination.value.page = 1;
  }
  void loadData();
});

onMounted(() => {
  void loadData();
});
</script>


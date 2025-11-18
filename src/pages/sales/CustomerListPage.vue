<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">ลูกค้า</div>
          <div class="text-subtitle2 text-grey-7">จัดการข้อมูลลูกค้า (สร้าง / แก้ไข / ลบ)</div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn color="primary" icon="add" label="เพิ่มลูกค้า" @click="goToCreate" />
          <q-btn
            flat
            color="primary"
            icon="refresh"
            label="รีเฟรช"
            :loading="loading"
            @click="refresh"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="search"
              label="ค้นหาชื่อ / รหัส / อีเมล"
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
            <q-select
              v-model="paymentTypeFilter"
              :options="paymentTypeOptions"
              emit-value
              map-options
              outlined
              dense
              clearable
              label="ประเภทชำระเงิน"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-table
        flat
        bordered
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        v-model:pagination="tablePagination"
        :rows-per-page-options="[10, 20, 50]"
        @request="onRequest"
      >
        <template #body-cell-is_active="props">
          <q-td :props="props">
            <q-badge :color="props.value ? 'positive' : 'grey'">
              {{ props.value ? 'ใช้งาน' : 'ไม่ใช้งาน' }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-payment_type="props">
          <q-td :props="props">
            <q-badge :color="props.value === 'credit' ? 'primary' : 'positive'">
              {{ props.value === 'credit' ? 'เครดิต' : 'เงินสด' }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-outstanding_balance="props">
          <q-td :props="props" class="text-right">
            <div
              class="text-weight-medium"
              :class="{
                'text-negative': props.row.outstanding_balance > 0,
                'text-positive': props.row.outstanding_balance === 0,
              }"
            >
              {{ formatCurrency(props.row.outstanding_balance) }}
            </div>
            <div
              v-if="props.row.is_over_credit_limit"
              class="text-caption text-negative"
            >
              เกินวงเงิน
            </div>
            <div
              v-else-if="props.row.is_overdue"
              class="text-caption text-warning"
            >
              เกินกำหนด
            </div>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn dense flat round icon="more_vert" color="grey-7">
              <q-menu>
                <q-list style="min-width: 160px">
                  <q-item clickable v-close-popup @click="viewCustomer(props.row.id)">
                    <q-item-section avatar>
                      <q-icon name="visibility" color="grey-7" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>ดูรายละเอียด</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="goToEdit(props.row.id)">
                    <q-item-section avatar>
                      <q-icon name="edit" color="primary" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>แก้ไข</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup @click="confirmDelete(props.row)">
                    <q-item-section avatar>
                      <q-icon name="delete" color="negative" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>ลบ</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-td>
        </template>

        <template #no-data>
          <div class="text-center q-pa-lg column items-center">
            <q-icon name="people" size="64px" color="grey-5" />
            <div class="text-subtitle1">ยังไม่มีข้อมูลลูกค้า</div>
            <div class="text-body2 text-grey-6">
              กดปุ่ม "เพิ่มลูกค้า" เพื่อสร้างข้อมูลลูกค้าใหม่
            </div>
          </div>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Dialog, type QTableProps } from 'quasar';
import {
  type Customer,
  type CustomerListParams,
  type PaginatedResponse,
  listCustomers,
  deleteCustomer,
} from '@/services/sales/api';
import { useNotifier } from '@/composables/useNotifier';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const router = useRouter();
const { success: notifySuccess, error: notifyError } = useNotifier();

const rows = ref<Customer[]>([]);
const loading = ref(false);

const tablePagination = ref<QTableProps['pagination']>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'name',
  descending: false,
});

const search = ref('');
const statusFilter = ref<'all' | 'active' | 'inactive' | null>('all');
const paymentTypeFilter = ref<'all' | 'credit' | 'cash' | null>('all');

const statusOptions = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'ใช้งาน', value: 'active' },
  { label: 'ไม่ใช้งาน', value: 'inactive' },
];

const paymentTypeOptions = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'เครดิต', value: 'credit' },
  { label: 'เงินสด', value: 'cash' },
];

const mapFiltersToParams = (): CustomerListParams => {
  let is_active: boolean | number | undefined;
  if (statusFilter.value === 'active') {
    is_active = 1;
  } else if (statusFilter.value === 'inactive') {
    is_active = 0;
  } else {
    is_active = undefined;
  }

  let payment_type: 'cash' | 'credit' | undefined;
  if (paymentTypeFilter.value === 'credit') {
    payment_type = 'credit';
  } else if (paymentTypeFilter.value === 'cash') {
    payment_type = 'cash';
  } else {
    payment_type = undefined;
  }

  const trimmedSearch = search.value?.trim();

  return {
    ...(trimmedSearch ? { search: trimmedSearch } : {}),
    ...(is_active !== undefined ? { is_active } : {}),
    ...(payment_type !== undefined ? { payment_type } : {}),
    page: tablePagination.value?.page ?? 1,
    per_page: tablePagination.value?.rowsPerPage ?? 10,
    sort: 'name',
  };
};

const performLoad = async () => {
  loading.value = true;
  try {
    const params = mapFiltersToParams();
    const { data, meta }: PaginatedResponse<Customer> = await listCustomers(params);
    rows.value = data;
    tablePagination.value = {
      ...tablePagination.value,
      page: meta.current_page,
      rowsPerPage: meta.per_page,
      rowsNumber: meta.total,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลลูกค้าได้';
    notifyError({ message });
  } finally {
    loading.value = false;
  }
};

const refresh = async () => {
  await performLoad();
};

const onRequest: QTableProps['onRequest'] = ({ pagination }) => {
  if (!pagination) return;
  tablePagination.value = pagination;
  void refresh();
};

watch([search, statusFilter, paymentTypeFilter], () => {
  tablePagination.value = {
    ...tablePagination.value,
    page: 1,
  };
  void refresh();
});

const columns = computed<QTableProps['columns']>(() => [
  {
    name: 'code',
    label: 'รหัส',
    field: 'code',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'name',
    label: 'ชื่อลูกค้า',
    field: 'name',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'email',
    label: 'อีเมล',
    field: 'email',
    align: 'left' as const,
  },
  {
    name: 'phone',
    label: 'เบอร์โทร',
    field: 'phone',
    align: 'left' as const,
  },
  {
    name: 'payment_type',
    label: 'ประเภทชำระเงิน',
    field: 'payment_type',
    align: 'left' as const,
  },
  {
    name: 'outstanding_balance',
    label: 'ยอดค้างชำระ',
    field: 'outstanding_balance',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'is_active',
    label: 'สถานะ',
    field: 'is_active',
    align: 'left' as const,
  },
  {
    name: 'created_at',
    label: 'สร้างเมื่อ',
    field: (row: Customer) => new Date(row.created_at).toLocaleString('th-TH'),
    align: 'left' as const,
  },
  {
    name: 'actions',
    label: '',
    field: 'id',
    align: 'right' as const,
  },
]);

const confirmDelete = (customer: Customer) => {
  Dialog.create({
    title: 'ยืนยันการลบ',
    message: `คุณต้องการลบลูกค้า "${customer.name}" หรือไม่?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await deleteCustomer(customer.id);
        notifySuccess({ message: 'ลบลูกค้าเรียบร้อยแล้ว' });
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'ไม่สามารถลบลูกค้าได้';
        notifyError({ message });
      }
    })();
  });
};

const viewCustomer = (id: number) => {
  void router.push({ name: 'sales-customers-detail', params: { id } });
};

const goToCreate = () => {
  void router.push({ name: 'sales-customers-create' });
};

const goToEdit = (id: number) => {
  void router.push({ name: 'sales-customers-edit', params: { id } });
};

onMounted(() => {
  void refresh();
});
</script>

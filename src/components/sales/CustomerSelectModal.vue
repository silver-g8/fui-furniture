<template>
  <q-dialog :model-value="modelValue" @update:model-value="(val) => $emit('update:modelValue', val)">
    <q-card style="min-width: 600px; max-width: 800px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">เลือกลูกค้า</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="search"
          label="ค้นหาลูกค้า (รหัส / ชื่อ / อีเมล / เบอร์โทร)"
          outlined
          dense
          clearable
          debounce="400"
          @update:model-value="handleSearch"
        >
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-table
          flat
          :rows="customers"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :rows-per-page-options="[10, 20, 50]"
          @request="onRequest"
          v-model:pagination="tablePagination"
        >
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
                  'text-negative': props.value > 0,
                  'text-positive': props.value === 0,
                }"
              >
                {{ formatCurrency(props.value) }}
              </div>
            </q-td>
          </template>

          <template #body-cell-credit_info="props">
            <q-td :props="props" class="text-right">
              <div v-if="props.row.payment_type === 'credit' && props.row.credit_limit" class="column q-gutter-xs">
                <div class="text-caption">
                  <span class="text-weight-medium">วงเงิน:</span>
                  <span class="q-ml-xs">{{ formatCurrency(props.row.credit_limit) }}</span>
                </div>
                <div class="text-caption">
                  <span class="text-weight-medium">ค้างชำระ:</span>
                  <span class="q-ml-xs">{{ formatCurrency(props.row.outstanding_balance || 0) }}</span>
                </div>
                <div class="text-caption">
                  <span class="text-weight-medium">ใช้ได้:</span>
                  <q-badge
                    :color="getAvailableCreditColor(props.row)"
                    :label="formatCurrency(getAvailableCredit(props.row))"
                    class="q-ml-xs"
                  />
                </div>
                <q-banner
                  v-if="isOverCreditLimit(props.row)"
                  dense
                  class="q-mt-xs q-pa-xs"
                  rounded
                  style="font-size: 0.7rem"
                >
                  <template #avatar>
                    <q-icon name="warning" color="negative" />
                  </template>
                  <div class="text-caption">เกินวงเงินเครดิต</div>
                </q-banner>
              </div>
              <div v-else-if="props.row.payment_type === 'credit'" class="text-caption text-grey-6">
                ไม่มีวงเงิน
              </div>
              <div v-else class="text-caption text-grey-6">-</div>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                dense
                color="primary"
                label="เลือก"
                @click="selectCustomer(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { QTableProps } from 'quasar';
import { listCustomers, type Customer, type CustomerListParams } from '@/services/sales/api';
import type { PaginatedResponse } from '@/services/sales/api';
import { formatCurrency } from '@/types/ar/common';

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'selected', customer: Customer): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const search = ref('');
const customers = ref<Customer[]>([]);
const loading = ref(false);
const tablePagination = ref<QTableProps['pagination']>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const columns: QTableProps['columns'] = [
  {
    name: 'code',
    label: 'รหัส',
    field: 'code',
    align: 'left',
    sortable: true,
  },
  {
    name: 'name',
    label: 'ชื่อลูกค้า',
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'payment_type',
    label: 'ประเภทชำระเงิน',
    field: 'payment_type',
    align: 'center',
  },
  {
    name: 'credit_limit',
    label: 'วงเงิน',
    field: 'credit_limit',
    align: 'right',
    format: (val) => (val ? formatCurrency(val) : '-'),
  },
  {
    name: 'outstanding_balance',
    label: 'ยอดค้างชำระ',
    field: 'outstanding_balance',
    align: 'right',
  },
  {
    name: 'credit_info',
    label: 'ข้อมูลเครดิต',
    field: 'credit_info',
    align: 'right',
  },
  {
    name: 'actions',
    label: '',
    field: '',
    align: 'center',
  },
];

const loadCustomers = async () => {
  loading.value = true;
  try {
    const params: CustomerListParams = {
      page: tablePagination.value?.page || 1,
      per_page: tablePagination.value?.rowsPerPage || 10,
    };
    if (search.value?.trim()) {
      params.search = search.value.trim();
    }
    const response: PaginatedResponse<Customer> = await listCustomers(params);
    customers.value = response.data || [];
    if (tablePagination.value) {
      tablePagination.value.rowsNumber = response.meta?.total || 0;
    }
  } catch (error) {
    console.error('Failed to load customers:', error);
    customers.value = [];
  } finally {
    loading.value = false;
  }
};

const onRequest: QTableProps['onRequest'] = ({ pagination }) => {
  if (pagination) {
    tablePagination.value = pagination;
    void loadCustomers();
  }
};

const handleSearch = () => {
  if (tablePagination.value) {
    tablePagination.value.page = 1;
  }
  void loadCustomers();
};

const getAvailableCredit = (customer: Customer): number => {
  if (customer.payment_type !== 'credit' || !customer.credit_limit) {
    return 0;
  }
  return Math.max(0, customer.credit_limit - (customer.outstanding_balance || 0));
};

const getAvailableCreditColor = (customer: Customer): string => {
  const available = getAvailableCredit(customer);
  const limit = customer.credit_limit || 0;
  if (available === 0) return 'negative';
  if (available < limit * 0.2) return 'warning';
  return 'positive';
};

const isOverCreditLimit = (customer: Customer): boolean => {
  if (customer.payment_type !== 'credit' || !customer.credit_limit) {
    return false;
  }
  return (customer.outstanding_balance || 0) > customer.credit_limit;
};

const selectCustomer = (customer: Customer) => {
  emit('selected', customer);
  emit('update:modelValue', false);
};

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    void loadCustomers();
  }
});
</script>


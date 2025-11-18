<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h5 q-mb-md">รายงานการขาย</div>
        <q-tabs v-model="tab" class="text-grey" active-color="primary" indicator-color="primary">
          <q-tab name="by-customer" label="ตามลูกค้า" />
          <q-tab name="by-product" label="ตามสินค้า" />
          <q-tab name="by-period" label="ตามช่วงเวลา" />
          <q-tab name="conversion" label="อัตราการแปลงใบเสนอราคา" />
        </q-tabs>
      </q-card-section>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <!-- By Customer Tab -->
        <q-tab-panel name="by-customer">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-4">
              <q-input
                v-model="filters.dateFrom"
                label="วันที่เริ่มต้น"
                type="date"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="filters.dateTo"
                label="วันที่สิ้นสุด"
                type="date"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-md-4">
              <q-btn
                color="primary"
                label="ค้นหา"
                @click="loadSalesByCustomer"
                :loading="loading"
              />
            </div>
          </div>

          <q-table
            :rows="salesByCustomer"
            :columns="customerColumns"
            row-key="customer_id"
            :loading="loading"
            flat
            bordered
          >
            <template v-slot:body-cell-total_amount="props">
              <q-td :props="props">
                {{ formatCurrency(props.value) }}
              </q-td>
            </template>
            <template v-slot:body-cell-avg_amount="props">
              <q-td :props="props">
                {{ formatCurrency(props.value) }}
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- By Product Tab -->
        <q-tab-panel name="by-product">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-4">
              <q-input
                v-model="filters.dateFrom"
                label="วันที่เริ่มต้น"
                type="date"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="filters.dateTo"
                label="วันที่สิ้นสุด"
                type="date"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-md-4">
              <q-btn
                color="primary"
                label="ค้นหา"
                @click="loadSalesByProduct"
                :loading="loading"
              />
            </div>
          </div>

          <q-table
            :rows="salesByProduct"
            :columns="productColumns"
            row-key="product_id"
            :loading="loading"
            flat
            bordered
          >
            <template v-slot:body-cell-total_amount="props">
              <q-td :props="props">
                {{ formatCurrency(props.value) }}
              </q-td>
            </template>
            <template v-slot:body-cell-avg_price="props">
              <q-td :props="props">
                {{ formatCurrency(props.value) }}
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- By Period Tab -->
        <q-tab-panel name="by-period">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-4">
              <q-input
                v-model="periodFilters.dateFrom"
                label="วันที่เริ่มต้น"
                type="date"
                outlined
                dense
                required
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="periodFilters.dateTo"
                label="วันที่สิ้นสุด"
                type="date"
                outlined
                dense
                required
              />
            </div>
            <div class="col-12 col-md-4">
              <q-btn
                color="primary"
                label="ค้นหา"
                @click="loadSalesByPeriod"
                :loading="loading"
                :disable="!periodFilters.dateFrom || !periodFilters.dateTo"
              />
            </div>
          </div>

          <q-table
            :rows="salesByPeriod"
            :columns="periodColumns"
            row-key="date"
            :loading="loading"
            flat
            bordered
          >
            <template v-slot:body-cell-total_amount="props">
              <q-td :props="props">
                {{ formatCurrency(props.value) }}
              </q-td>
            </template>
            <template v-slot:body-cell-avg_amount="props">
              <q-td :props="props">
                {{ formatCurrency(props.value) }}
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- Conversion Rate Tab -->
        <q-tab-panel name="conversion">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-4">
              <q-input
                v-model="filters.dateFrom"
                label="วันที่เริ่มต้น"
                type="date"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="filters.dateTo"
                label="วันที่สิ้นสุด"
                type="date"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-md-4">
              <q-btn
                color="primary"
                label="ค้นหา"
                @click="loadConversionRate"
                :loading="loading"
              />
            </div>
          </div>

          <q-card v-if="conversionRate !== null" class="q-mt-md">
            <q-card-section>
              <div class="text-h6">อัตราการแปลงใบเสนอราคา</div>
              <div class="text-h3 text-primary q-mt-md">
                {{ conversionRate }}%
              </div>
            </q-card-section>
          </q-card>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  getSalesByCustomer,
  getSalesByProduct,
  getSalesByPeriod,
  getQuotationConversionRate,
  type SalesByCustomer,
  type SalesByProduct,
  type SalesByPeriod,
} from '@/services/sales/salesReport.service';

const tab = ref('by-customer');
const loading = ref(false);

const filters = ref({
  dateFrom: '',
  dateTo: '',
  customer_id: undefined as number | undefined,
  product_id: undefined as number | undefined,
});

const periodFilters = ref({
  dateFrom: '',
  dateTo: '',
});

const salesByCustomer = ref<SalesByCustomer[]>([]);
const salesByProduct = ref<SalesByProduct[]>([]);
const salesByPeriod = ref<SalesByPeriod[]>([]);
const conversionRate = ref<number | null>(null);

const customerColumns = [
  {
    name: 'customer_code',
    label: 'รหัสลูกค้า',
    field: 'customer_code',
    align: 'left' as const,
  },
  {
    name: 'customer_name',
    label: 'ชื่อลูกค้า',
    field: 'customer_name',
    align: 'left' as const,
  },
  {
    name: 'order_count',
    label: 'จำนวนคำสั่งซื้อ',
    field: 'order_count',
    align: 'center' as const,
  },
  {
    name: 'total_amount',
    label: 'ยอดรวม',
    field: 'total_amount',
    align: 'right' as const,
  },
  {
    name: 'avg_amount',
    label: 'ยอดเฉลี่ย',
    field: 'avg_amount',
    align: 'right' as const,
  },
];

const productColumns = [
  {
    name: 'product_code',
    label: 'รหัสสินค้า',
    field: 'product_code',
    align: 'left' as const,
  },
  {
    name: 'product_name',
    label: 'ชื่อสินค้า',
    field: 'product_name',
    align: 'left' as const,
  },
  {
    name: 'total_qty',
    label: 'จำนวน',
    field: 'total_qty',
    align: 'center' as const,
  },
  {
    name: 'total_amount',
    label: 'ยอดรวม',
    field: 'total_amount',
    align: 'right' as const,
  },
  {
    name: 'avg_price',
    label: 'ราคาเฉลี่ย',
    field: 'avg_price',
    align: 'right' as const,
  },
];

const periodColumns = [
  {
    name: 'date',
    label: 'วันที่',
    field: 'date',
    align: 'left' as const,
  },
  {
    name: 'order_count',
    label: 'จำนวนคำสั่งซื้อ',
    field: 'order_count',
    align: 'center' as const,
  },
  {
    name: 'total_amount',
    label: 'ยอดรวม',
    field: 'total_amount',
    align: 'right' as const,
  },
  {
    name: 'avg_amount',
    label: 'ยอดเฉลี่ย',
    field: 'avg_amount',
    align: 'right' as const,
  },
];

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(value);
};

const loadSalesByCustomer = async () => {
  loading.value = true;
  try {
    const result = await getSalesByCustomer({
      ...(filters.value.dateFrom && { date_from: filters.value.dateFrom }),
      ...(filters.value.dateTo && { date_to: filters.value.dateTo }),
      ...(filters.value.customer_id && { customer_id: filters.value.customer_id }),
    });
    salesByCustomer.value = result.data;
  } catch (error) {
    console.error('Error loading sales by customer:', error);
  } finally {
    loading.value = false;
  }
};

const loadSalesByProduct = async () => {
  loading.value = true;
  try {
    const result = await getSalesByProduct({
      ...(filters.value.dateFrom && { date_from: filters.value.dateFrom }),
      ...(filters.value.dateTo && { date_to: filters.value.dateTo }),
      ...(filters.value.product_id && { product_id: filters.value.product_id }),
    });
    salesByProduct.value = result.data;
  } catch (error) {
    console.error('Error loading sales by product:', error);
  } finally {
    loading.value = false;
  }
};

const loadSalesByPeriod = async () => {
  if (!periodFilters.value.dateFrom || !periodFilters.value.dateTo) {
    return;
  }
  loading.value = true;
  try {
    const result = await getSalesByPeriod(
      periodFilters.value.dateFrom,
      periodFilters.value.dateTo,
    );
    salesByPeriod.value = result.data;
  } catch (error) {
    console.error('Error loading sales by period:', error);
  } finally {
    loading.value = false;
  }
};

const loadConversionRate = async () => {
  loading.value = true;
  try {
    const result = await getQuotationConversionRate({
      ...(filters.value.dateFrom && { date_from: filters.value.dateFrom }),
      ...(filters.value.dateTo && { date_to: filters.value.dateTo }),
      ...(filters.value.customer_id && { customer_id: filters.value.customer_id }),
    });
    conversionRate.value = result.conversion_rate;
  } catch (error) {
    console.error('Error loading conversion rate:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  // Set default date range to last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  filters.value.dateFrom = thirtyDaysAgo.toISOString().split('T')[0] as string;
  filters.value.dateTo = today.toISOString().split('T')[0] as string;
  periodFilters.value.dateFrom = thirtyDaysAgo.toISOString().split('T')[0] as string;
  periodFilters.value.dateTo = today.toISOString().split('T')[0] as string;
});
</script>


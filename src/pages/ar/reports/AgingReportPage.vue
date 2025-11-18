<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">{{ $t('ar.report.aging.title') }}</div>
        <div class="text-caption text-grey-6">
          {{ $t('ar.report.aging.as_of_date') }}: {{ asOfDateLabel }}
        </div>
      </div>

      <div class="row items-center q-gutter-sm">
        <q-input
          v-model="asOfDate"
          type="date"
          outlined
          dense
          style="min-width: 200px"
          @update:model-value="loadReport"
        />
        <q-toggle
          v-model="includeInvoices"
          :label="$t('ar.report.aging.include_invoices')"
          @update:model-value="loadReport"
        />
        <q-btn
          color="primary"
          icon="refresh"
          :loading="loading"
          rounded
          dense
          @click="loadReport"
        >
          <span class="q-ml-sm">{{ $t('ar.common.refresh') }}</span>
        </q-btn>
        <q-btn
          flat
          color="primary"
          icon="download"
          :label="$t('ar.common.export')"
          :disable="!reportData"
          @click="handleExport"
        />
        <q-btn
          flat
          color="primary"
          icon="print"
          :label="$t('ar.common.print')"
          :disable="!reportData"
          @click="handlePrint"
        />
      </div>
    </div>

    <q-banner
      v-if="error"
      inline-actions
      rounded
      class="bg-negative text-white q-mb-md"
      icon="warning"
    >
      {{ error }}
      <template #action>
        <q-btn flat color="white" dense @click="loadReport">
          {{ $t('ar.dashboard.retry') }}
        </q-btn>
      </template>
    </q-banner>

    <div v-if="loading && !reportData" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="64px" />
    </div>

    <div v-else-if="reportData">
      <!-- Summary -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">{{ $t('ar.report.aging.aging_buckets') }}</div>
          <div class="row q-col-gutter-md">
            <div
              v-for="bucket in reportData.summary.buckets"
              :key="bucket.bucket"
              class="col-12 col-sm-6 col-md-4 col-lg-2"
            >
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-caption text-grey-7 q-mb-xs">
                    {{ $t(`ar.report.aging.${bucket.bucket}`) }}
                  </div>
                  <div class="text-h6 text-weight-bold" :class="getBucketTextColor(bucket.bucket)">
                    {{ formatCurrency(bucket.amount) }}
                  </div>
                  <div class="text-caption text-grey-6">
                    {{ bucket.count }} {{ $t('ar.dashboard.invoices') }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <div class="row items-center justify-between">
            <div class="text-subtitle1 text-weight-medium">
              {{ $t('ar.report.aging.total_customers') }}: {{ reportData.summary.total_customers }}
            </div>
            <div class="text-h6 text-weight-bold text-primary">
              {{ $t('ar.report.aging.total_outstanding') }}: {{ formatCurrency(reportData.summary.total_outstanding) }}
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Customer Details -->
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6 q-mb-md">{{ $t('ar.report.aging.by_customer') }}</div>

          <q-table
            flat
            :rows="reportData.customers"
            :columns="customerColumns"
            row-key="customer_id"
            :loading="loading"
            :rows-per-page-options="[10, 20, 50, 100]"
            v-model:pagination="pagination"
            :expanded="Object.keys(expandedRows)"
          >
            <!-- Customer -->
            <template #body-cell-customer="props">
              <q-td :props="props">
                <div class="text-weight-medium">{{ props.row.customer_name }}</div>
                <div class="text-caption text-grey-7">{{ props.row.customer_code }}</div>
              </q-td>
            </template>

            <!-- Amounts -->
            <template #body-cell-total_outstanding="props">
              <q-td :props="props" class="text-right">
                <div class="text-weight-medium text-negative">
                  {{ formatCurrency(props.row.total_outstanding) }}
                </div>
              </q-td>
            </template>

            <template #body-cell-current="props">
              <q-td :props="props" class="text-right">
                {{ formatCurrency(props.row.buckets.current) }}
              </q-td>
            </template>

            <template #body-cell-overdue_1_30="props">
              <q-td :props="props" class="text-right text-warning">
                {{ formatCurrency(props.row.buckets.overdue_1_30) }}
              </q-td>
            </template>

            <template #body-cell-overdue_31_60="props">
              <q-td :props="props" class="text-right text-orange">
                {{ formatCurrency(props.row.buckets.overdue_31_60) }}
              </q-td>
            </template>

            <template #body-cell-overdue_61_90="props">
              <q-td :props="props" class="text-right text-negative">
                {{ formatCurrency(props.row.buckets.overdue_61_90) }}
              </q-td>
            </template>

            <template #body-cell-overdue_90_plus="props">
              <q-td :props="props" class="text-right text-red">
                {{ formatCurrency(props.row.buckets.overdue_90_plus) }}
              </q-td>
            </template>

            <!-- Expand Row for Invoices -->
            <template #body="props">
              <q-tr :props="props">
                <q-td auto-width>
                  <q-btn
                    v-if="props.row.invoices && props.row.invoices.length > 0"
                    size="sm"
                    round
                    dense
                    :icon="expandedRows[props.row.customer_id] ? 'expand_less' : 'expand_more'"
                    @click="expandedRows[props.row.customer_id] = !expandedRows[props.row.customer_id]"
                  />
                </q-td>
                <q-td v-for="col in props.cols" :key="col.name" :props="props">
                  <slot :name="`body-cell-${col.name}`" :props="props" />
                </q-td>
              </q-tr>
              <q-tr v-show="expandedRows[props.row.customer_id]" :props="props">
                <q-td colspan="100%">
                  <div class="q-pa-md">
                    <div class="text-subtitle2 q-mb-sm">{{ $t('ar.invoice.title') }}</div>
                    <q-table
                      flat
                      bordered
                      :rows="props.row.invoices || []"
                      :columns="invoiceColumns"
                      row-key="invoice_id"
                      :rows-per-page-options="[0]"
                      hide-pagination
                    >
                      <template #body-cell-open_amount="invProps">
                        <q-td :props="invProps" class="text-right">
                          <div class="text-weight-medium">
                            {{ formatCurrency(invProps.row.open_amount) }}
                          </div>
                        </q-td>
                      </template>
                      <template #body-cell-days_overdue="invProps">
                        <q-td :props="invProps" class="text-right">
                          <q-chip
                            v-if="invProps.row.days_overdue > 0"
                            dense
                            :color="getOverdueColor(invProps.row.days_overdue)"
                            text-color="white"
                          >
                            {{ invProps.row.days_overdue }} {{ $t('ar.dashboard.days') }}
                          </q-chip>
                          <span v-else class="text-grey-6">-</span>
                        </q-td>
                      </template>
                    </q-table>
                  </div>
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QTableProps } from 'quasar';
import { formatCurrency, formatDate } from '@/types/ar/common';
import {
  getAgingReport,
  type AgingReportData,
} from '@/services/ar/arReportService';
import { useNotifier } from '@/composables/useNotifier';
import { exportToCsv } from '@/utils/export';
import { printHtml } from '@/utils/print';
import type { AgingBucket } from '@/types/ar/common';

const { t } = useI18n();
const { error: notifyError } = useNotifier();

// State
const loading = ref(false);
const error = ref<string | null>(null);
const reportData = ref<AgingReportData | null>(null);
const asOfDate = ref<string>(new Date().toISOString().split('T')[0] as string);
const includeInvoices = ref(false);
const expandedRows = ref<Record<string, boolean>>({});

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
});

// Computed
const asOfDateLabel = computed(() => {
  return formatDate(asOfDate.value);
});

// Table columns
const customerColumns = computed<QTableProps['columns']>(() => [
  {
    name: 'customer',
    label: t('ar.common.customer'),
    field: 'customer_name',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'total_outstanding',
    label: t('ar.report.aging.total_outstanding'),
    field: 'total_outstanding',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'current',
    label: t('ar.report.aging.current'),
    field: (row) => row.buckets.current,
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'overdue_1_30',
    label: t('ar.report.aging.overdue_1_30'),
    field: (row) => row.buckets.overdue_1_30,
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'overdue_31_60',
    label: t('ar.report.aging.overdue_31_60'),
    field: (row) => row.buckets.overdue_31_60,
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'overdue_61_90',
    label: t('ar.report.aging.overdue_61_90'),
    field: (row) => row.buckets.overdue_61_90,
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'overdue_90_plus',
    label: t('ar.report.aging.overdue_90_plus'),
    field: (row) => row.buckets.overdue_90_plus,
    align: 'right' as const,
    sortable: true,
  },
]);

const invoiceColumns = computed<QTableProps['columns']>(() => [
  {
    name: 'invoice_no',
    label: t('ar.invoice.invoice_no'),
    field: 'invoice_no',
    align: 'left' as const,
  },
  {
    name: 'invoice_date',
    label: t('ar.invoice.invoice_date'),
    field: 'invoice_date',
    align: 'left' as const,
  },
  {
    name: 'due_date',
    label: t('ar.invoice.due_date'),
    field: 'due_date',
    align: 'left' as const,
  },
  {
    name: 'open_amount',
    label: t('ar.invoice.open_amount'),
    field: 'open_amount',
    align: 'right' as const,
  },
  {
    name: 'days_overdue',
    label: t('ar.report.aging.days_overdue'),
    field: 'days_overdue',
    align: 'right' as const,
  },
]);

// Helper functions
const getBucketTextColor = (bucket: AgingBucket): string => {
  const colors: Record<AgingBucket, string> = {
    current: 'text-positive',
    overdue_1_30: 'text-warning',
    overdue_31_60: 'text-orange',
    overdue_61_90: 'text-negative',
    overdue_90_plus: 'text-red',
  };
  return colors[bucket] || 'text-grey';
};

const getOverdueColor = (days: number): string => {
  if (days <= 30) return 'warning';
  if (days <= 60) return 'orange';
  if (days <= 90) return 'negative';
  return 'red';
};

// Load report
const loadReport = async () => {
  loading.value = true;
  error.value = null;
  try {
    reportData.value = await getAgingReport(asOfDate.value, includeInvoices.value);
  } catch (err) {
    const message = err instanceof Error ? err.message : t('ar.report.aging.load_error');
    error.value = message;
    notifyError({ message });
  } finally {
    loading.value = false;
  }
};

// Export
const handleExport = () => {
  if (!reportData.value) return;

  const headers = [
    'รหัสลูกค้า',
    'ชื่อลูกค้า',
    'ยอดคงค้างทั้งหมด',
    'ยังไม่ถึงกำหนด',
    'เกิน 1-30 วัน',
    'เกิน 31-60 วัน',
    'เกิน 61-90 วัน',
    'เกิน 90+ วัน',
  ];

  const rows = reportData.value.customers.map((customer) => [
    customer.customer_code,
    customer.customer_name,
    customer.total_outstanding,
    customer.buckets.current,
    customer.buckets.overdue_1_30,
    customer.buckets.overdue_31_60,
    customer.buckets.overdue_61_90,
    customer.buckets.overdue_90_plus,
  ]);

  exportToCsv(rows, `aging_report_${asOfDate.value}.csv`, headers);
};

// Print
const handlePrint = () => {
  if (!reportData.value) return;

  const html = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1>${t('ar.report.aging.title')}</h1>
      <h3>${t('ar.report.aging.as_of_date')}: ${asOfDateLabel.value}</h3>
    </div>

    <div style="margin-bottom: 20px;">
      <h3>${t('ar.report.aging.aging_buckets')}</h3>
      <table>
        <thead>
          <tr>
            <th>${t('ar.report.aging.bucket')}</th>
            <th class="text-right">${t('ar.common.amount')}</th>
            <th class="text-right">${t('ar.dashboard.invoices')}</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.value.summary.buckets
            .map(
              (bucket) => `
            <tr>
              <td>${t(`ar.report.aging.${bucket.bucket}`)}</td>
              <td class="text-right">${formatCurrency(bucket.amount)}</td>
              <td class="text-right">${bucket.count}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
        <tfoot>
          <tr>
            <td><strong>${t('ar.report.aging.total_outstanding')}</strong></td>
            <td class="text-right"><strong>${formatCurrency(reportData.value.summary.total_outstanding)}</strong></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div>
      <h3>${t('ar.report.aging.by_customer')}</h3>
      <table>
        <thead>
          <tr>
            <th>${t('ar.common.customer')}</th>
            <th class="text-right">${t('ar.report.aging.total_outstanding')}</th>
            <th class="text-right">${t('ar.report.aging.current')}</th>
            <th class="text-right">${t('ar.report.aging.overdue_1_30')}</th>
            <th class="text-right">${t('ar.report.aging.overdue_31_60')}</th>
            <th class="text-right">${t('ar.report.aging.overdue_61_90')}</th>
            <th class="text-right">${t('ar.report.aging.overdue_90_plus')}</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.value.customers
            .map(
              (customer) => `
            <tr>
              <td>${customer.customer_name} (${customer.customer_code})</td>
              <td class="text-right">${formatCurrency(customer.total_outstanding)}</td>
              <td class="text-right">${formatCurrency(customer.buckets.current)}</td>
              <td class="text-right">${formatCurrency(customer.buckets.overdue_1_30)}</td>
              <td class="text-right">${formatCurrency(customer.buckets.overdue_31_60)}</td>
              <td class="text-right">${formatCurrency(customer.buckets.overdue_61_90)}</td>
              <td class="text-right">${formatCurrency(customer.buckets.overdue_90_plus)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  printHtml(html, `AgingReport_${asOfDate.value}`);
};

onMounted(() => {
  void loadReport();
});
</script>

<style scoped>
.text-red {
  color: #c62828;
}
</style>


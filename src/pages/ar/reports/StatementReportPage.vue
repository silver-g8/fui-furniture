<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">{{ $t('ar.report.statement.title') }}</div>
      </div>

      <div class="row items-center q-gutter-sm">
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

    <!-- Filters -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-select
              v-model="selectedCustomerId"
              :options="customerOptions"
              :label="$t('ar.common.customer')"
              option-value="id"
              option-label="name"
              emit-value
              map-options
              outlined
              use-input
              input-debounce="300"
              :loading="loadingCustomers"
              :rules="[(val) => !!val || $t('ar.validation.must_select_customer')]"
              @filter="filterCustomers"
            >
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    {{ $t('ar.common.no_results') }}
                  </q-item-section>
                </q-item>
              </template>
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.name }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.code }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-3">
            <q-input
              v-model="dateFrom"
              :label="$t('ar.report.statement.date_from')"
              type="date"
              outlined
              :rules="[(val) => !!val || $t('ar.validation.required')]"
            />
          </div>

          <div class="col-12 col-md-3">
            <q-input
              v-model="dateTo"
              :label="$t('ar.report.statement.date_to')"
              type="date"
              outlined
              :rules="[
                (val) => !!val || $t('ar.validation.required'),
                (val) => val >= dateFrom || $t('ar.validation.invalid_date'),
              ]"
            />
          </div>

          <div class="col-12 col-md-2">
            <q-btn
              color="primary"
              :label="$t('ar.common.search')"
              :loading="loading"
              style="width: 100%"
              @click="loadReport"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

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
      <!-- Customer Info -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-7">{{ $t('ar.common.customer') }}</div>
              <div class="text-h6 text-weight-medium">{{ reportData.customer_name }}</div>
              <div class="text-body2 text-grey-7">{{ reportData.customer_code }}</div>
            </div>
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-7">
                {{ $t('ar.report.statement.date_from') }} - {{ $t('ar.report.statement.date_to') }}
              </div>
              <div class="text-body1">
                {{ formatDate(reportData.date_from) }} - {{ formatDate(reportData.date_to) }}
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Summary -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <div class="text-caption text-grey-7 q-mb-xs">
                {{ $t('ar.report.statement.opening_balance') }}
              </div>
              <div class="text-h6 text-weight-bold">
                {{ formatCurrency(reportData.opening_balance) }}
              </div>
            </div>
            <div class="col-12 col-md-4">
              <div class="text-caption text-grey-7 q-mb-xs">
                {{ $t('ar.report.statement.closing_balance') }}
              </div>
              <div class="text-h6 text-weight-bold" :class="getBalanceClass(reportData.closing_balance)">
                {{ formatCurrency(reportData.closing_balance) }}
              </div>
            </div>
            <div class="col-12 col-md-4">
              <div class="text-caption text-grey-7 q-mb-xs">
                {{ $t('ar.report.statement.transactions') }}
              </div>
              <div class="text-h6 text-weight-bold">
                {{ reportData.transactions.length }}
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Transactions -->
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6 q-mb-md">{{ $t('ar.report.statement.transactions') }}</div>

          <q-table
            flat
            :rows="reportData.transactions"
            :columns="transactionColumns"
            row-key="id"
            :rows-per-page-options="[0]"
            hide-pagination
          >
            <!-- Date -->
            <template #body-cell-date="props">
              <q-td :props="props">
                {{ formatDate(props.row.date) }}
              </q-td>
            </template>

            <!-- Type -->
            <template #body-cell-type="props">
              <q-td :props="props">
                <q-chip dense :color="getTypeColor(props.row.type)" text-color="white">
                  {{ getTypeLabel(props.row.type) }}
                </q-chip>
              </q-td>
            </template>

            <!-- Amounts -->
            <template #body-cell-debit="props">
              <q-td :props="props" class="text-right">
                <div v-if="parseFloat(props.row.debit) > 0" class="text-weight-medium text-negative">
                  {{ formatCurrency(props.row.debit) }}
                </div>
                <span v-else class="text-grey-6">-</span>
              </q-td>
            </template>

            <template #body-cell-credit="props">
              <q-td :props="props" class="text-right">
                <div v-if="parseFloat(props.row.credit) > 0" class="text-weight-medium text-positive">
                  {{ formatCurrency(props.row.credit) }}
                </div>
                <span v-else class="text-grey-6">-</span>
              </q-td>
            </template>

            <template #body-cell-balance="props">
              <q-td :props="props" class="text-right">
                <div class="text-weight-medium" :class="getBalanceClass(props.row.balance)">
                  {{ formatCurrency(props.row.balance) }}
                </div>
              </q-td>
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
  getStatementReport,
  type StatementReportData,
} from '@/services/ar/arReportService';
import { useNotifier } from '@/composables/useNotifier';
import { exportToCsv } from '@/utils/export';
import { printHtml } from '@/utils/print';

interface CustomerOption {
  id: number;
  code: string;
  name: string;
}

const { t } = useI18n();
const { error: notifyError } = useNotifier();

// State
const loading = ref(false);
const loadingCustomers = ref(false);
const error = ref<string | null>(null);
const reportData = ref<StatementReportData | null>(null);
const selectedCustomerId = ref<number | null>(null);
const dateFrom = ref<string>(new Date(new Date().setDate(1)).toISOString().split('T')[0] as string); // First day of current month
const dateTo = ref<string>(new Date().toISOString().split('T')[0] as string); // Today

const customerOptions = ref<CustomerOption[]>([
  { id: 1, code: 'C001', name: 'บริษัท ABC จำกัด' },
  { id: 2, code: 'C002', name: 'บริษัท XYZ จำกัด' },
  { id: 3, code: 'C003', name: 'ร้าน DEF' },
]);

// Table columns
const transactionColumns = computed<QTableProps['columns']>(() => [
  {
    name: 'date',
    label: t('ar.common.date'),
    field: 'date',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'type',
    label: t('ar.report.statement.type'),
    field: 'type',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'reference_no',
    label: t('ar.common.reference_no'),
    field: 'reference_no',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'description',
    label: t('ar.invoice.description'),
    field: 'description',
    align: 'left' as const,
  },
  {
    name: 'debit',
    label: t('ar.report.statement.debit'),
    field: 'debit',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'credit',
    label: t('ar.report.statement.credit'),
    field: 'credit',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'balance',
    label: t('ar.report.statement.running_balance'),
    field: 'balance',
    align: 'right' as const,
    sortable: true,
  },
]);

// Helper functions
const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    invoice: t('ar.invoice.title'),
    receipt: t('ar.receipt.title'),
    credit_note: t('ar.credit_note.title'),
    deposit: t('ar.deposit.title'),
  };
  return labels[type] || type;
};

const getTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    invoice: 'negative',
    receipt: 'positive',
    credit_note: 'warning',
    deposit: 'info',
  };
  return colors[type] || 'grey';
};

const getBalanceClass = (balance: string): string => {
  const amount = parseFloat(balance);
  if (amount > 0) return 'text-negative';
  if (amount < 0) return 'text-positive';
  return 'text-grey-6';
};

const filterCustomers = (val: string, update: (fn: () => void) => void) => {
  // In production, this should call an API to search customers
  update(() => {
    if (val === '') {
      customerOptions.value = [
        { id: 1, code: 'C001', name: 'บริษัท ABC จำกัด' },
        { id: 2, code: 'C002', name: 'บริษัท XYZ จำกัด' },
        { id: 3, code: 'C003', name: 'ร้าน DEF' },
      ];
    } else {
      const needle = val.toLowerCase();
      customerOptions.value = [
        { id: 1, code: 'C001', name: 'บริษัท ABC จำกัด' },
        { id: 2, code: 'C002', name: 'บริษัท XYZ จำกัด' },
        { id: 3, code: 'C003', name: 'ร้าน DEF' },
      ].filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          c.code.toLowerCase().includes(needle),
      );
    }
  });
};

// Load report
const loadReport = async () => {
  if (!selectedCustomerId.value) {
    error.value = t('ar.validation.must_select_customer');
    return;
  }

  loading.value = true;
  error.value = null;
  try {
    reportData.value = await getStatementReport(
      selectedCustomerId.value,
      dateFrom.value,
      dateTo.value,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : t('ar.report.statement.load_error');
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
    'วันที่',
    'ประเภท',
    'เลขที่อ้างอิง',
    'รายละเอียด',
    'เดบิต',
    'เครดิต',
    'ยอดคงเหลือ',
  ];

  const rows = reportData.value.transactions.map((txn) => [
    txn.date,
    getTypeLabel(txn.type),
    txn.reference_no,
    txn.description,
    txn.debit,
    txn.credit,
    txn.balance,
  ]);

  exportToCsv(rows, `statement_${reportData.value.customer_code}_${dateFrom.value}_${dateTo.value}.csv`, headers);
};

// Print
const handlePrint = () => {
  if (!reportData.value) return;

  const html = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1>${t('ar.report.statement.title')}</h1>
      <h3>${reportData.value.customer_name} (${reportData.value.customer_code})</h3>
      <p>${formatDate(reportData.value.date_from)} - ${formatDate(reportData.value.date_to)}</p>
    </div>

    <div style="margin-bottom: 20px;">
      <table style="width: 100%; border: none;">
        <tr>
          <td style="border: none; text-align: right; width: 50%;">
            <strong>${t('ar.report.statement.opening_balance')}:</strong>
          </td>
          <td style="border: none; text-align: right; width: 50%;">
            ${formatCurrency(reportData.value.opening_balance)}
          </td>
        </tr>
        <tr>
          <td style="border: none; text-align: right;">
            <strong>${t('ar.report.statement.closing_balance')}:</strong>
          </td>
          <td style="border: none; text-align: right;">
            ${formatCurrency(reportData.value.closing_balance)}
          </td>
        </tr>
      </table>
    </div>

    <table>
      <thead>
        <tr>
          <th>${t('ar.common.date')}</th>
          <th>${t('ar.report.statement.type')}</th>
          <th>${t('ar.common.reference_no')}</th>
          <th>${t('ar.invoice.description')}</th>
          <th class="text-right">${t('ar.report.statement.debit')}</th>
          <th class="text-right">${t('ar.report.statement.credit')}</th>
          <th class="text-right">${t('ar.report.statement.running_balance')}</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.value.transactions
          .map(
            (txn) => `
          <tr>
            <td>${formatDate(txn.date)}</td>
            <td>${getTypeLabel(txn.type)}</td>
            <td>${txn.reference_no}</td>
            <td>${txn.description}</td>
            <td class="text-right">${parseFloat(txn.debit) > 0 ? formatCurrency(txn.debit) : '-'}</td>
            <td class="text-right">${parseFloat(txn.credit) > 0 ? formatCurrency(txn.credit) : '-'}</td>
            <td class="text-right">${formatCurrency(txn.balance)}</td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>
  `;

  printHtml(html, `Statement_${reportData.value.customer_code}_${dateFrom.value}`);
};

onMounted(() => {
  // Auto-load if customer is already selected
  // In production, this might come from route params
});
</script>


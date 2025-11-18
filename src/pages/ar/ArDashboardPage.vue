<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">{{ $t('ar.dashboard.title') }}</div>
        <div class="text-caption text-grey-6">
          {{ lastUpdatedLabel }}
        </div>
      </div>

      <div class="row items-center q-gutter-sm">
        <q-btn
          color="primary"
          icon="refresh"
          :loading="loading"
          rounded
          dense
          @click="refresh"
        >
          <span class="q-ml-sm">{{ $t('ar.common.refresh') }}</span>
        </q-btn>
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
        <q-btn flat color="white" dense @click="refresh">
          {{ $t('ar.dashboard.retry') }}
        </q-btn>
      </template>
    </q-banner>

    <!-- Metrics Cards -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-4 col-lg-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7 q-mb-xs">
              {{ $t('ar.dashboard.metrics.total_outstanding') }}
            </div>
            <div class="text-h5 text-weight-bold text-primary">
              {{ formatCurrency(metrics.total_outstanding) }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-4 col-lg-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7 q-mb-xs">
              {{ $t('ar.dashboard.metrics.overdue_amount') }}
            </div>
            <div class="text-h5 text-weight-bold text-negative">
              {{ formatCurrency(metrics.overdue_amount) }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-4 col-lg-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7 q-mb-xs">
              {{ $t('ar.dashboard.metrics.current_month_collection') }}
            </div>
            <div class="text-h5 text-weight-bold text-positive">
              {{ formatCurrency(metrics.current_month_collection) }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-4 col-lg-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7 q-mb-xs">
              {{ $t('ar.dashboard.metrics.dso') }}
            </div>
            <div class="text-h5 text-weight-bold">
              {{ metrics.dso }} {{ $t('ar.dashboard.days') }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-4 col-lg-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7 q-mb-xs">
              {{ $t('ar.dashboard.metrics.collection_rate') }}
            </div>
            <div class="text-h5 text-weight-bold">
              {{ metrics.collection_rate.toFixed(1) }}%
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Charts and Tables -->
    <div class="row q-col-gutter-md">
      <!-- Aging Summary Chart -->
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              {{ $t('ar.dashboard.charts.aging_summary') }}
            </div>
            <div v-if="loading && !agingSummary" class="row justify-center q-pa-xl">
              <q-spinner color="primary" size="48px" />
            </div>
            <div v-else-if="agingSummary">
              <div class="row q-col-gutter-sm q-mb-md">
                <div
                  v-for="bucket in agingSummary.buckets"
                  :key="bucket.bucket"
                  class="col-12"
                >
                  <div class="row items-center q-gutter-sm">
                    <div class="col-4 text-body2">
                      {{ bucket.bucket ? $t(`ar.report.aging.${bucket.bucket}`) : $t('ar.report.aging.current') }}
                    </div>
                    <div class="col-3 text-right text-weight-medium">
                      {{ formatCurrency(bucket.amount) }}
                    </div>
                    <div class="col-2 text-right text-grey-7">
                      {{ bucket.count }} {{ $t('ar.dashboard.invoices') }}
                    </div>
                    <div class="col-3">
                      <q-linear-progress
                        :value="getBucketPercentage(bucket)"
                        :color="getBucketColor(bucket.bucket)"
                        size="20px"
                        rounded
                      />
                    </div>
                  </div>
                </div>
              </div>
              <q-separator class="q-my-md" />
              <div class="row items-center justify-between">
                <div class="text-subtitle1 text-weight-medium">
                  {{ $t('ar.report.aging.total_outstanding') }}
                </div>
                <div class="text-h6 text-weight-bold text-primary">
                  {{ formatCurrency(agingSummary.total) }}
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Collection Trend Chart -->
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center justify-between q-mb-md">
              <div class="text-h6">
                {{ $t('ar.dashboard.charts.collection_trend') }}
              </div>
              <q-select
                v-model="collectionPeriod"
                :options="periodOptions"
                dense
                outlined
                emit-value
                map-options
                style="min-width: 120px"
                @update:model-value="loadCollectionTrend"
              />
            </div>
            <div v-if="loading && !collectionTrend" class="row justify-center q-pa-xl">
              <q-spinner color="primary" size="48px" />
            </div>
            <div v-else-if="collectionTrend && collectionTrend.data.length > 0">
              <div class="row q-col-gutter-xs">
                <div
                  v-for="(item, index) in collectionTrend.data"
                  :key="index"
                  class="col-12"
                >
                  <div class="row items-center q-gutter-sm">
                    <div class="col-4 text-body2">
                      {{ formatDate(item.date) }}
                    </div>
                    <div class="col-6">
                      <q-linear-progress
                        :value="getTrendPercentage(item)"
                        color="positive"
                        size="20px"
                        rounded
                      />
                    </div>
                    <div class="col-2 text-right text-weight-medium text-positive">
                      {{ formatCurrency(item.amount) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-grey-6 q-pa-md">
              {{ $t('ar.dashboard.no_data') }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Top Customers -->
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              {{ $t('ar.dashboard.charts.top_customers') }}
            </div>
            <div v-if="loading && !topCustomers" class="row justify-center q-pa-xl">
              <q-spinner color="primary" size="48px" />
            </div>
            <q-table
              v-else-if="topCustomers"
              flat
              :rows="topCustomers.customers"
              :columns="topCustomersColumns"
              row-key="customer_id"
              :rows-per-page-options="[0]"
              hide-pagination
            >
              <!-- Customer -->
              <template #body-cell-customer="props">
                <q-td :props="props">
                  <div class="text-weight-medium">{{ props.row.customer_name }}</div>
                  <div class="text-caption text-grey-7">{{ props.row.customer_code }}</div>
                </q-td>
              </template>

              <!-- Outstanding Amount -->
              <template #body-cell-outstanding_amount="props">
                <q-td :props="props" class="text-right">
                  <div class="text-weight-medium text-negative">
                    {{ formatCurrency(props.row.outstanding_amount) }}
                  </div>
                </q-td>
              </template>

              <!-- Invoice Count -->
              <template #body-cell-invoice_count="props">
                <q-td :props="props" class="text-right">
                  <q-chip dense color="primary" text-color="white">
                    {{ props.row.invoice_count }}
                  </q-chip>
                </q-td>
              </template>
            </q-table>
            <div v-else class="text-center text-grey-6 q-pa-md">
              {{ $t('ar.dashboard.no_data') }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { date } from 'quasar';
import type { QTableProps } from 'quasar';
import { formatCurrency, formatDate } from '@/types/ar/common';
import {
  getArDashboard,
  type ArDashboardMetrics,
  type AgingSummary,
  type CollectionTrend,
  type TopCustomers,
} from '@/services/ar/arDashboardService';
import { useNotifier } from '@/composables/useNotifier';
import type { AgingBucket } from '@/types/ar/common';

const { t } = useI18n();
const { error: notifyError } = useNotifier();

// State
const loading = ref(false);
const error = ref<string | null>(null);
const lastUpdated = ref<Date | null>(null);

const metrics = ref<ArDashboardMetrics>({
  total_outstanding: '0',
  overdue_amount: '0',
  current_month_collection: '0',
  dso: 0,
  collection_rate: 0,
});

const agingSummary = ref<AgingSummary | null>(null);
const collectionTrend = ref<CollectionTrend | null>(null);
const topCustomers = ref<TopCustomers | null>(null);
const collectionPeriod = ref<'week' | 'month' | 'quarter'>('month');

const periodOptions = computed(() => [
  { label: t('ar.dashboard.period.week'), value: 'week' },
  { label: t('ar.dashboard.period.month'), value: 'month' },
  { label: t('ar.dashboard.period.quarter'), value: 'quarter' },
]);

const lastUpdatedLabel = computed(() => {
  if (!lastUpdated.value) {
    return t('ar.dashboard.last_updated.never');
  }
  return t('ar.dashboard.last_updated.at', {
    datetime: date.formatDate(lastUpdated.value, 'YYYY-MM-DD HH:mm'),
  });
});

// Table columns for top customers
const topCustomersColumns = computed<QTableProps['columns']>(() => [
  {
    name: 'customer',
    label: t('ar.common.customer'),
    field: 'customer_name',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'outstanding_amount',
    label: t('ar.invoice.open_amount'),
    field: 'outstanding_amount',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'invoice_count',
    label: t('ar.dashboard.invoice_count'),
    field: 'invoice_count',
    align: 'right' as const,
    sortable: true,
  },
]);

// Helper functions
const getBucketPercentage = (bucket: { amount: string }): number => {
  if (!agingSummary.value || parseFloat(agingSummary.value.total) === 0) {
    return 0;
  }
  return parseFloat(bucket.amount) / parseFloat(agingSummary.value.total);
};

const getBucketColor = (bucket: AgingBucket): string => {
  const colors: Record<AgingBucket, string> = {
    current: 'positive',
    overdue_1_30: 'warning',
    overdue_31_60: 'orange',
    overdue_61_90: 'negative',
    overdue_90_plus: 'red',
  };
  return colors[bucket] || 'grey';
};

const getTrendPercentage = (item: { amount: string }): number => {
  if (!collectionTrend.value || collectionTrend.value.data.length === 0) {
    return 0;
  }
  const maxAmount = Math.max(
    ...collectionTrend.value.data.map((d) => parseFloat(d.amount)),
  );
  if (maxAmount === 0) return 0;
  return parseFloat(item.amount) / maxAmount;
};

// Load data
const loadDashboard = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await getArDashboard();
    metrics.value = data.metrics;
    agingSummary.value = data.aging_summary;
    collectionTrend.value = data.collection_trend;
    topCustomers.value = data.top_customers;
    lastUpdated.value = new Date();
  } catch (err) {
    const message = err instanceof Error ? err.message : t('ar.dashboard.load_error');
    error.value = message;
    notifyError({ message });
  } finally {
    loading.value = false;
  }
};

const loadCollectionTrend = async () => {
  // This will be called when period changes
  // For now, we reload the whole dashboard
  // In the future, we can optimize to only reload collection trend
  await loadDashboard();
};

const refresh = async () => {
  await loadDashboard();
};

onMounted(() => {
  void loadDashboard();
});
</script>

<style scoped>
.q-card {
  min-height: 200px;
}
</style>


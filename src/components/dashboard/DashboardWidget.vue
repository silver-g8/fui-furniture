<template>
<DashboardCard
  :title="translatedTitle"
  :icon="icon"
  :size="widget.size"
  :loading="resolvedLoading"
  :error="errorMessage"
  :last-updated="lastUpdated"
>
  <template #actions>
    <slot name="actions" />
    <q-spinner
      v-if="resolvedLoading"
      size="18px"
      color="primary"
      class="dashboard-widget__action-spinner"
    />
    <q-btn
      v-else-if="showRetryAction"
      dense
      flat
      color="primary"
      icon="refresh"
      @click="handleRetry"
    >
      <span class="q-ml-xs">{{ t('dashboard.actions.retry') }}</span>
    </q-btn>
  </template>

  <div v-if="showEmptyState" class="dashboard-widget__empty">
    <q-icon name="insert_chart_outlined" size="36px" color="grey-5" />
    <p class="text-caption text-grey-6 q-mt-sm">
      {{ t('dashboard.noData') }}
    </p>
  </div>
  <component v-else :is="contentComponent" v-bind="contentProps" />
</DashboardCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import DashboardCard from './DashboardCard.vue';
import MetricWidget from './widgets/MetricWidget.vue';
import ChartWidgetSummary from './widgets/ChartWidgetSummary.vue';
import TableWidget from './widgets/TableWidget.vue';
import ListWidget from './widgets/ListWidget.vue';
import RawWidget from './widgets/RawWidget.vue';
import type { DashboardWidget } from '@/types/dashboard';
import type {
  DashboardMetricData,
  DashboardChartData,
  DashboardChartDataset,
  DashboardTableData,
  DashboardListData,
} from '@/types/dashboard';

const props = defineProps<{
  widget: DashboardWidget;
  loading?: boolean;
  error?: string | null;
  lastUpdated?: Date | null;
}>();

const emit = defineEmits<{
  (event: 'retry', widgetId: string): void;
}>();

const { t } = useI18n();

const translatedTitle = computed(() => t(props.widget.title));
const icon = computed(() => {
  const rawIcon = props.widget.config?.icon;
  return typeof rawIcon === 'string' && rawIcon.length > 0 ? rawIcon : undefined;
});
const resolvedLoading = computed(() => props.loading ?? props.widget.loading ?? false);
const rawError = computed(() => props.error ?? props.widget.error ?? null);
const lastUpdated = computed(() => props.lastUpdated ?? null);

const contentComponent = computed(() => {
  switch (props.widget.type) {
    case 'metric':
      return MetricWidget;
    case 'chart':
      return ChartWidgetSummary;
    case 'table':
      return TableWidget;
    case 'list':
      return ListWidget;
    default:
      return RawWidget;
  }
});

const contentProps = computed<Record<string, unknown>>(() => {
  const data = props.widget.data;

  if (!data) {
    return {};
  }

  switch (props.widget.type) {
    case 'metric':
      return { data: data as DashboardMetricData };
    case 'chart':
      return { data: data as DashboardChartData };
    case 'table':
      return { data: data as DashboardTableData };
    case 'list':
      return { data: data as DashboardListData };
    default:
      return { data };
  }
});

const errorMessage = computed(() => {
  if (!rawError.value) {
    return null;
  }

  const value = typeof rawError.value === 'string' ? rawError.value.trim() : '';
  return value.length > 0 ? value : t('dashboard.errors.generic');
});

const showRetryAction = computed(() => !!errorMessage.value);

const hasData = computed(() => {
  const data = props.widget.data;
  if (!data) {
    return false;
  }

  switch (props.widget.type) {
    case 'metric': {
      const metric = data as DashboardMetricData;
      return metric.value !== undefined && metric.value !== null && metric.value !== '';
    }
    case 'chart': {
      const chart = data as DashboardChartData;
      return (
        chart.datasets?.some(
          (dataset: DashboardChartDataset) =>
            Array.isArray(dataset.data) && dataset.data.length > 0,
        ) ?? false
      );
    }
    case 'table': {
      const table = data as DashboardTableData;
      return table.rows?.length > 0;
    }
    case 'list': {
      const list = data as DashboardListData;
      return list.items?.length > 0;
    }
    default:
      return Object.keys(data).length > 0;
  }
});

const showEmptyState = computed(() => !resolvedLoading.value && !errorMessage.value && !hasData.value);

const handleRetry = () => {
  emit('retry', props.widget.id);
};
</script>

<style scoped>
.dashboard-widget__action-spinner {
  margin-left: 4px;
}

.dashboard-widget__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  text-align: center;
  padding: 16px;
  border: 1px dashed var(--q-color-grey-4);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.02);
}
</style>


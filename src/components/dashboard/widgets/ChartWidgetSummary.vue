<template>
  <div class="column q-gutter-sm">
    <div class="text-subtitle2 text-grey-7">
      {{ chartTypeLabel }}
    </div>
    <div v-if="datasets.length === 0" class="text-caption text-grey-6">
      {{ noDataLabel }}
    </div>
    <q-list v-else dense bordered separator class="rounded-borders">
      <q-item v-for="dataset in datasets" :key="dataset.label">
        <q-item-section>
          <q-item-label class="text-weight-medium">
            {{ dataset.label }}
          </q-item-label>
          <q-item-label caption>
            {{ datasetSummary(dataset.data) }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DashboardChartData } from '@/types/dashboard';

const props = defineProps<{
  data?: DashboardChartData;
}>();

const { t } = useI18n();

const datasets = computed(() => props.data?.datasets ?? []);
const noDataLabel = computed(() => t('dashboard.noData'));
const chartTypeLabel = computed(() => t(`dashboard.chartTypes.${props.data?.chartType ?? 'line'}`));

const datasetSummary = (values: number[]) => {
  const total = values.reduce((sum, value) => sum + value, 0);
  return t('dashboard.chartSummary', { points: values.length, total });
};
</script>


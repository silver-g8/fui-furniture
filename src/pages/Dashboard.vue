<template>
  <q-page padding data-testid="dashboard-page">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">
          {{ t('dashboard.title') }}
        </div>
        <div class="text-caption text-grey-6">
          {{ lastUpdatedLabel }}
        </div>
      </div>

      <div class="row items-center q-gutter-sm">
        <q-btn
          color="primary"
          icon="refresh"
          :loading="dashboard.loading"
          rounded
          dense
          @click="refresh"
        >
          <span class="q-ml-sm">{{ t('dashboard.actions.refresh') }}</span>
        </q-btn>

        <q-btn
          flat
          color="primary"
          icon="download"
          dense
          @click="exportData"
        >
          <span class="q-ml-xs">{{ t('dashboard.actions.export') }}</span>
        </q-btn>
      </div>
    </div>

    <q-banner
      v-if="dashboard.hasError"
      inline-actions
      rounded
      class="bg-negative text-white q-mb-md"
      icon="warning"
    >
      {{ dashboard.error }}
      <template #action>
        <q-btn flat color="white" dense @click="refresh">
          {{ t('dashboard.actions.retry') }}
        </q-btn>
      </template>
    </q-banner>

    <div class="row q-col-gutter-md">
      <div
        v-for="widget in orderedWidgets"
        :key="widget.id"
        :class="['col-12', widgetColClass(widget.size)]"
      >
        <DashboardWidget
          :widget="widget"
          :loading="dashboard.loading && !widget.data"
          :last-updated="dashboard.lastUpdated"
          @retry="handleWidgetRetry"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { date } from 'quasar';
import DashboardWidget from '@/components/dashboard/DashboardWidget.vue';
import { useDashboardStore } from '@/stores/dashboard-store';
import type { DashboardWidget as DashboardWidgetType, DashboardWidgetSize } from '@/types/dashboard';

defineOptions({
  name: 'DashboardPage',
});

const dashboard = useDashboardStore();
const { t } = useI18n();

const orderedWidgets = computed<DashboardWidgetType[]>(() =>
  [...dashboard.widgets].sort((a, b) => {
    if (a.position.row === b.position.row) {
      return a.position.col - b.position.col;
    }
    return a.position.row - b.position.row;
  }),
);

const lastUpdatedLabel = computed(() => {
  if (!dashboard.lastUpdated) {
    return t('dashboard.lastUpdated.never');
  }
  return t('dashboard.lastUpdated.at', {
    datetime: date.formatDate(dashboard.lastUpdated, 'YYYY-MM-DD HH:mm'),
  });
});

const widgetColClass = (size: DashboardWidgetSize) => {
  switch (size) {
    case 'small':
      return 'col-sm-6 col-md-4 col-lg-3';
    case 'large':
      return 'col-sm-12 col-md-8';
    case 'full':
      return 'col-12';
    default:
      return 'col-sm-6 col-md-6 col-lg-4';
  }
};

const refresh = async () => {
  await dashboard.fetchDashboardData({ refresh: true });
};
const handleWidgetRetry = async () => {
  await refresh();
};

const exportData = () => {
  // TODO: ส่งออกข้อมูลในเฟสอนาคต
};

onMounted(async () => {
  await dashboard.fetchDashboardData();
});
</script>

<style scoped>
.q-page {
  min-height: calc(100vh - 100px);
}
</style>


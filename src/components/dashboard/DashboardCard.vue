<template>
  <q-card :class="cardClass" data-testid="dashboard-card">
    <q-card-section class="row items-center q-col-gutter-sm">
      <div v-if="icon" class="col-auto">
        <q-icon :name="icon" size="md" />
      </div>
      <div class="col">
        <div class="text-subtitle1 text-weight-medium">
          {{ title }}
        </div>
        <div v-if="lastUpdated" class="text-caption text-grey-6">
          {{ formattedLastUpdated }}
        </div>
      </div>
      <div class="col-auto">
        <slot name="actions" />
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div v-if="loading" class="dashboard-card__loading column items-center q-gutter-sm q-py-md">
        <q-spinner color="primary" size="32px" />
        <span class="text-caption text-grey-7">
          {{ $t('dashboard.loading') }}
        </span>
        <div class="dashboard-card__skeleton-list column q-gutter-xs q-mt-sm">
          <q-skeleton
            v-for="line in skeletonLines"
            :key="line"
            type="text"
            class="dashboard-card__skeleton-line"
          />
        </div>
      </div>
      <q-banner
        v-else-if="error"
        dense
        rounded
        class="bg-negative text-white"
        icon="warning"
      >
        {{ error }}
      </q-banner>
      <slot v-else />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { date } from 'quasar';
import type { DashboardWidgetSize } from '@/types/dashboard';

const sizeClassMap: Record<DashboardWidgetSize, string> = {
  small: 'dashboard-card--small',
  medium: 'dashboard-card--medium',
  large: 'dashboard-card--large',
  full: 'dashboard-card--full',
};

const props = withDefaults(
  defineProps<{
    title: string;
    loading?: boolean;
    error?: string | null;
    icon?: string;
    size?: DashboardWidgetSize;
    lastUpdated?: Date | null;
  }>(),
  {
    loading: false,
    error: null,
    size: 'medium',
    lastUpdated: null,
  },
);

const cardClass = computed(() => ['dashboard-card', sizeClassMap[props.size]]);

const formattedLastUpdated = computed(() => {
  if (!props.lastUpdated) {
    return '';
  }

  return date.formatDate(props.lastUpdated, 'YYYY-MM-DD HH:mm');
});

const skeletonLines = computed(() => {
  switch (props.size) {
    case 'small':
      return 2;
    case 'large':
      return 5;
    case 'full':
      return 6;
    default:
      return 3;
  }
});
</script>

<style scoped>
.dashboard-card {
  min-height: 180px;
  display: flex;
  flex-direction: column;
}

.dashboard-card--small {
  min-height: 160px;
}

.dashboard-card--large {
  min-height: 260px;
}

.dashboard-card--full {
  min-height: 320px;
}

.dashboard-card__skeleton-list {
  width: 100%;
}

.dashboard-card__skeleton-line {
  width: 100%;
  max-width: 280px;
}

@media (min-width: 768px) {
  .dashboard-card__skeleton-line {
    max-width: 360px;
  }
}
</style>


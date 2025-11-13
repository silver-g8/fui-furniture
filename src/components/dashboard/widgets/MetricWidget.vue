<template>
  <div class="column q-gutter-sm">
    <div class="text-h4 text-weight-bold">
      {{ displayValue }}
    </div>
    <div class="text-subtitle2 text-grey-7">
      {{ data?.label ?? '-' }}
    </div>
    <div v-if="hasChange" class="row items-center q-gutter-xs">
      <q-icon :name="changeIcon" :color="changeColor" size="sm" />
      <span :class="['text-body2', `text-${changeColor}`]">
        {{ data?.change }}%
      </span>
      <span class="text-caption text-grey-6">
        {{ changePeriod }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DashboardMetricData } from '@/types/dashboard';

const props = defineProps<{
  data?: DashboardMetricData;
}>();

const displayValue = computed(() => props.data?.value ?? '--');
const hasChange = computed(() => typeof props.data?.change === 'number');

const changeColor = computed(() => {
  if (!props.data) return 'grey';
  switch (props.data.changeType) {
    case 'increase':
      return 'positive';
    case 'decrease':
      return 'negative';
    default:
      return 'grey';
  }
});

const changeIcon = computed(() => {
  if (!props.data) return 'trending_flat';
  switch (props.data.changeType) {
    case 'increase':
      return 'trending_up';
    case 'decrease':
      return 'trending_down';
    default:
      return 'trending_flat';
  }
});

const changePeriod = computed(() => props.data?.period ?? '');
</script>


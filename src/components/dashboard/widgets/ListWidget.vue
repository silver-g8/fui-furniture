<template>
  <q-list bordered separator class="rounded-borders">
    <template v-if="items.length">
      <q-item v-for="(item, index) in items" :key="index">
        <q-item-section>
          <q-item-label class="text-weight-medium">
            {{ item.title ?? item.name ?? item.id ?? index + 1 }}
          </q-item-label>
          <q-item-label caption v-if="item.subtitle || item.status">
            {{ item.subtitle ?? item.status }}
          </q-item-label>
        </q-item-section>
        <q-item-section side v-if="item.badge">
          <q-badge color="primary">
            {{ item.badge }}
          </q-badge>
        </q-item-section>
      </q-item>
    </template>
    <div v-else class="text-caption text-grey-6 q-pa-md">
      {{ noDataLabel }}
    </div>
  </q-list>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DashboardListData } from '@/types/dashboard';

const props = defineProps<{
  data?: DashboardListData;
}>();

const { t } = useI18n();

const items = computed(() => props.data?.items ?? []);
const noDataLabel = computed(() => t('dashboard.noData'));
</script>


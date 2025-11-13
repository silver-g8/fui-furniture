<template>
  <div>
    <q-markup-table v-if="hasRows" flat bordered>
      <thead>
        <tr>
          <th v-for="header in headers" :key="header" class="text-left">
            {{ header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
          <td v-for="(cell, cellIndex) in row" :key="cellIndex">
            {{ cell }}
          </td>
        </tr>
      </tbody>
    </q-markup-table>
    <div v-else class="text-caption text-grey-6">
      {{ noDataLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DashboardTableData } from '@/types/dashboard';

const props = defineProps<{
  data?: DashboardTableData;
}>();

const { t } = useI18n();

const headers = computed(() => props.data?.headers ?? []);
const rows = computed(() => props.data?.rows ?? []);
const hasRows = computed(() => rows.value.length > 0);
const noDataLabel = computed(() => t('dashboard.noData'));
</script>


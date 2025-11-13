<template>
  <pre class="dashboard-raw-widget">
{{ formatted }}
  </pre>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  data?: Record<string, unknown>;
}>();

const formatted = computed(() => JSON.stringify(props.data ?? {}, null, 2));
</script>

<style scoped>
.dashboard-raw-widget {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  padding: 12px;
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}
</style>


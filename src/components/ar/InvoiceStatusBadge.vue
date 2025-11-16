<template>
  <q-badge
    :color="statusColor"
    :label="statusLabel"
    class="text-weight-medium"
    :class="badgeClass"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { InvoiceStatus } from '@/types/ar/common';
import { INVOICE_STATUS_COLORS } from '@/types/ar/common';
import { useI18n } from 'vue-i18n';

interface Props {
  status: InvoiceStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
});

const { t } = useI18n();

const statusColor = computed(() => INVOICE_STATUS_COLORS[props.status]);

const statusLabel = computed(() => t(`ar.invoice.status.${props.status}`));

const badgeClass = computed(() => {
  const sizeClasses = {
    xs: 'text-caption',
    sm: 'text-caption',
    md: '',
    lg: 'text-body2',
  };
  return sizeClasses[props.size];
});
</script>

<style scoped>
.q-badge {
  padding: 4px 8px;
  border-radius: 4px;
}
</style>

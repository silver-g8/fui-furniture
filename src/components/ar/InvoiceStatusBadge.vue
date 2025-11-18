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
  isPendingPayment?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  isPendingPayment: false,
});

const { t } = useI18n();

const statusColor = computed(() => {
  if (props.isPendingPayment) {
    return 'warning';
  }
  return INVOICE_STATUS_COLORS[props.status];
});

const statusLabel = computed(() => {
  if (props.isPendingPayment) {
    return t('ar.invoice.status.pending_payment');
  }
  return t(`ar.invoice.status.${props.status}`);
});

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

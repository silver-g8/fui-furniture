<template>
  <q-badge
    :color="badgeColor"
    :label="methodLabel"
    class="text-weight-medium"
    :class="badgeClass"
    outline
  >
    <q-icon :name="methodIcon" size="14px" class="q-mr-xs" />
  </q-badge>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PaymentMethod } from '@/types/ar/common';
import { useI18n } from 'vue-i18n';

interface Props {
  paymentMethod: PaymentMethod;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
});

const { t } = useI18n();

const METHOD_COLORS: Record<PaymentMethod, string> = {
  cash: 'green',
  bank_transfer: 'blue',
  cheque: 'purple',
  credit_card: 'orange',
  promissory_note: 'indigo',
  qr_code: 'teal',
  online_store: 'pink',
};

const METHOD_ICONS: Record<PaymentMethod, string> = {
  cash: 'payments',
  bank_transfer: 'account_balance',
  cheque: 'receipt_long',
  credit_card: 'credit_card',
  promissory_note: 'description',
  qr_code: 'qr_code',
  online_store: 'store',
};

const badgeColor = computed(() => METHOD_COLORS[props.paymentMethod]);

const methodIcon = computed(() => METHOD_ICONS[props.paymentMethod]);

const methodLabel = computed(() => t(`ar.receipt.payment_methods.${props.paymentMethod}`));

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
  padding: 4px 10px;
  border-radius: 4px;
}
</style>

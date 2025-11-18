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
import type { CreditNoteStatus } from '@/types/ar/common';
import { CREDIT_NOTE_STATUS_COLORS } from '@/types/ar/common';
import { useI18n } from 'vue-i18n';

interface Props {
  status: CreditNoteStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
});

const { t } = useI18n();

const statusColor = computed(() => CREDIT_NOTE_STATUS_COLORS[props.status]);

const statusLabel = computed(() => t(`ar.credit_note.status.${props.status}`));

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


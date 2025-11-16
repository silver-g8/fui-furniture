<template>
  <div class="line-item-editor">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div class="text-subtitle1 text-weight-medium">{{ $t('ar.invoice.line_items') }}</div>
      <q-btn
        color="primary"
        icon="add"
        :label="$t('ar.common.add')"
        size="sm"
        unelevated
        @click="addItem"
      />
    </div>

    <!-- Table -->
    <q-table
      flat
      bordered
      :rows="localItems"
      :columns="columns"
      row-key="id"
      :rows-per-page-options="[0]"
      hide-pagination
      class="q-mb-md"
    >
      <!-- Product/Description -->
      <template #body-cell-description="props">
        <q-td :props="props">
          <q-input
            v-model="props.row.description"
            dense
            outlined
            :placeholder="$t('ar.invoice.line_items')"
            @update:model-value="updateItem(props.rowIndex)"
          />
        </q-td>
      </template>

      <!-- Quantity -->
      <template #body-cell-quantity="props">
        <q-td :props="props">
          <q-input
            v-model.number="props.row.quantity"
            type="number"
            dense
            outlined
            min="0"
            step="0.01"
            @update:model-value="updateItem(props.rowIndex)"
          />
        </q-td>
      </template>

      <!-- Unit Price -->
      <template #body-cell-unit_price="props">
        <q-td :props="props">
          <q-input
            v-model.number="props.row.unit_price"
            type="number"
            dense
            outlined
            min="0"
            step="0.01"
            @update:model-value="updateItem(props.rowIndex)"
          />
        </q-td>
      </template>

      <!-- Discount -->
      <template #body-cell-discount_amount="props">
        <q-td :props="props">
          <q-input
            v-model.number="props.row.discount_amount"
            type="number"
            dense
            outlined
            min="0"
            step="0.01"
            @update:model-value="updateItem(props.rowIndex)"
          />
        </q-td>
      </template>

      <!-- Tax -->
      <template #body-cell-tax_amount="props">
        <q-td :props="props">
          <q-input
            v-model.number="props.row.tax_amount"
            type="number"
            dense
            outlined
            min="0"
            step="0.01"
            @update:model-value="updateItem(props.rowIndex)"
          />
        </q-td>
      </template>

      <!-- Line Total (read-only) -->
      <template #body-cell-line_total="props">
        <q-td :props="props" class="text-weight-medium">
          {{ formatCurrency(props.row.line_total) }}
        </q-td>
      </template>

      <!-- Actions -->
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            round
            color="negative"
            icon="delete"
            size="sm"
            @click="removeItem(props.rowIndex)"
          >
            <q-tooltip>{{ $t('ar.common.delete') }}</q-tooltip>
          </q-btn>
        </q-td>
      </template>

      <!-- No data -->
      <template #no-data>
        <div class="text-center q-pa-md text-grey-6">
          <q-icon name="inventory_2" size="48px" />
          <div class="text-subtitle2 q-mt-sm">{{ $t('ar.invoice.no_items') }}</div>
          <div class="text-caption">{{ $t('ar.invoice.click_add_items') }}</div>
        </div>
      </template>
    </q-table>

    <!-- Summary -->
    <div class="row justify-end">
      <div class="col-12 col-md-5">
        <q-list dense bordered class="rounded-borders">
          <q-item>
            <q-item-section>
              <q-item-label>{{ $t('ar.invoice.subtotal') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-weight-medium">
                {{ formatCurrency(summary.subtotal) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-separator />

          <q-item>
            <q-item-section>
              <q-item-label>{{ $t('ar.invoice.discount') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-negative">
                -{{ formatCurrency(summary.discount) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-separator />

          <q-item>
            <q-item-section>
              <q-item-label>{{ $t('ar.invoice.tax') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label>{{ formatCurrency(summary.tax) }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator />

          <q-item class="bg-grey-2">
            <q-item-section>
              <q-item-label class="text-weight-bold">
                {{ $t('ar.invoice.grand_total') }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-weight-bold text-h6 text-primary">
                {{ formatCurrency(summary.grandTotal) }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { QTableProps } from 'quasar';
import type { InvoiceLineItemPayload } from '@/types/ar/invoice';
import { calculateLineTotal } from '@/types/ar/invoice';
import { formatCurrency } from '@/types/ar/common';
import { useI18n } from 'vue-i18n';

interface Props {
  modelValue: InvoiceLineItemPayload[];
  readonly?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: InvoiceLineItemPayload[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
});

const emit = defineEmits<Emits>();
const { t } = useI18n();

// Local state
const localItems = ref<InvoiceLineItemPayload[]>([...props.modelValue]);

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    localItems.value = [...newValue];
  },
  { deep: true },
);

// Table columns
const columns = computed<QTableProps['columns']>(() => [
  {
    name: 'description',
    label: t('ar.invoice.description'),
    field: 'description',
    align: 'left' as const,
    style: 'min-width: 250px',
  },
  {
    name: 'quantity',
    label: t('ar.invoice.quantity'),
    field: 'quantity',
    align: 'right' as const,
    style: 'width: 100px',
  },
  {
    name: 'unit_price',
    label: t('ar.invoice.unit_price'),
    field: 'unit_price',
    align: 'right' as const,
    style: 'width: 120px',
  },
  {
    name: 'discount_amount',
    label: t('ar.invoice.discount'),
    field: 'discount_amount',
    align: 'right' as const,
    style: 'width: 100px',
  },
  {
    name: 'tax_amount',
    label: t('ar.invoice.tax'),
    field: 'tax_amount',
    align: 'right' as const,
    style: 'width: 100px',
  },
  {
    name: 'line_total',
    label: t('ar.invoice.line_total'),
    field: 'line_total',
    align: 'right' as const,
    style: 'width: 120px',
  },
  {
    name: 'actions',
    label: '',
    field: 'id',
    align: 'center' as const,
    style: 'width: 60px',
  },
]);

// Summary calculations
const summary = computed(() => {
  const subtotal = localItems.value.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unit_price;
    return sum + itemSubtotal;
  }, 0);

  const discount = localItems.value.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
  const tax = localItems.value.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
  const grandTotal = subtotal - discount + tax;

  return {
    subtotal,
    discount,
    tax,
    grandTotal,
  };
});

// Add new item
const addItem = () => {
  const newItem: InvoiceLineItemPayload = {
    product_id: null,
    description: '',
    quantity: 1,
    unit_price: 0,
    discount_amount: 0,
    tax_amount: 0,
  };
  localItems.value.push(newItem);
  emitUpdate();
};

// Remove item
const removeItem = (index: number) => {
  localItems.value.splice(index, 1);
  emitUpdate();
};

// Update item (recalculate line_total)
const updateItem = (index: number) => {
  const item = localItems.value[index];
  if (item) {
    // Ensure numbers are valid
    item.quantity = item.quantity || 0;
    item.unit_price = item.unit_price || 0;
    item.discount_amount = item.discount_amount || 0;
    item.tax_amount = item.tax_amount || 0;

    // Calculate line total
    const lineTotal = calculateLineTotal(item);
    // Assign back including computed line_total so the table can display it
    localItems.value[index] = {
      ...item,
      line_total: lineTotal,
    } as InvoiceLineItemPayload;

    emitUpdate();
  }
};

// Emit changes to parent
const emitUpdate = () => {
  emit('update:modelValue', [...localItems.value]);
};
</script>

<style scoped lang="scss">
.line-item-editor {
  width: 100%;

  :deep(.q-table) {
    th {
      font-weight: 600;
    }

    .q-field--dense {
      .q-field__control {
        height: 32px;
      }
    }
  }
}
</style>

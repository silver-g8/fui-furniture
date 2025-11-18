<template>
  <div>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-subtitle1 text-weight-medium">
        {{ $t('ar.receipt.allocations') }}
      </div>
      <q-btn
        v-if="availableInvoices.length > 0"
        dense
        flat
        color="primary"
        icon="add"
        :label="$t('ar.receipt.add_allocation')"
        @click="addAllocation"
      />
    </div>

    <div v-if="!customerId" class="text-center q-pa-lg text-grey-6">
      <q-icon name="info" size="48px" class="q-mb-sm" />
      <div>{{ $t('ar.receipt.select_customer_first') }}</div>
    </div>

    <div v-else-if="availableInvoices.length === 0" class="text-center q-pa-lg text-grey-6">
      <q-icon name="check_circle" size="48px" class="q-mb-sm" />
      <div>{{ $t('ar.receipt.no_outstanding_invoices') }}</div>
    </div>

    <div v-else>
      <!-- Allocations Table -->
      <q-table
        flat
        bordered
        :rows="localAllocations"
        :columns="columns"
        row-key="invoice_id"
        :rows-per-page-options="[0]"
        hide-pagination
      >
        <!-- Invoice Selection -->
        <template #body-cell-invoice_id="props">
          <q-td :props="props">
            <q-select
              v-model="props.row.invoice_id"
              :options="getAvailableInvoicesForRow(props.row)"
              :label="$t('ar.receipt.select_invoice')"
              option-value="id"
              option-label="invoice_no"
              emit-value
              map-options
              outlined
              dense
              :rules="[(val) => !!val || $t('ar.validation.required')]"
              @update:model-value="onInvoiceChange(props.row)"
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.invoice_no }}</q-item-label>
                    <q-item-label caption>
                      {{ $t('ar.invoice.open_amount') }}: {{ formatCurrency(scope.opt.open_amount) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </q-td>
        </template>

        <!-- Invoice Info -->
        <template #body-cell-invoice_info="props">
          <q-td :props="props">
            <div v-if="props.row.invoice_id">
              <div class="text-weight-medium">
                {{ getInvoiceByIdCached(props.row.invoice_id)?.invoice_no }}
              </div>
              <div class="text-caption text-grey-7">
                {{ $t('ar.invoice.open_amount') }}:
                {{ formatCurrency(getInvoiceByIdCached(props.row.invoice_id)?.open_amount || '0') }}
              </div>
            </div>
            <div v-else class="text-grey-7">-</div>
          </q-td>
        </template>

        <!-- Amount Input -->
        <template #body-cell-amount="props">
          <q-td :props="props">
            <q-input
              v-model.number="props.row.amount"
              type="number"
              :label="$t('ar.receipt.amount')"
              outlined
              dense
              min="0"
              step="0.01"
              :rules="[
                (val) => val > 0 || $t('ar.validation.invalid_amount'),
                (val) =>
                  val <= getMaxAllowedAmount(props.row) ||
                  $t('ar.validation.amount_exceeds_open'),
              ]"
            />
          </q-td>
        </template>

        <!-- Actions -->
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              dense
              flat
              round
              icon="delete"
              color="negative"
              @click="removeAllocation(props.rowIndex)"
            >
              <q-tooltip>{{ $t('ar.common.delete') }}</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>

      <!-- Summary -->
      <div class="q-mt-md q-pa-md bg-grey-2 rounded-borders">
        <div class="row justify-end q-gutter-md">
          <div>
            <div class="text-caption text-grey-7">{{ $t('ar.receipt.amount') }}</div>
            <div class="text-h6">{{ formatCurrency(receiptAmount) }}</div>
          </div>
          <div>
            <div class="text-caption text-grey-7">{{ $t('ar.receipt.allocated_total') }}</div>
            <div class="text-h6">{{ formatCurrency(totalAllocated) }}</div>
          </div>
          <div>
            <div class="text-caption text-grey-7">{{ $t('ar.receipt.unallocated_amount') }}</div>
            <div
              class="text-h6"
              :class="{
                'text-warning': unallocatedAmount > 0,
                'text-positive': unallocatedAmount === 0,
                'text-negative': unallocatedAmount < 0,
              }"
            >
              {{ formatCurrency(unallocatedAmount) }}
            </div>
          </div>
        </div>

        <div v-if="unallocatedAmount < 0" class="text-negative text-caption q-mt-sm text-right">
          {{ $t('ar.validation.allocation_exceeds_amount') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QTableProps } from 'quasar';
import type { ReceiptAllocationPayload } from '@/types/ar/receipt';
import { formatCurrency } from '@/types/ar/common';

interface InvoiceOption {
  id: number;
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  open_amount: string;
  grand_total: string;
}

// Local allocation type that allows undefined invoice_id for new allocations
interface LocalAllocation {
  invoice_id?: number;
  amount: number;
}

interface Props {
  modelValue: ReceiptAllocationPayload[];
  customerId?: number;
  receiptAmount: number;
  availableInvoices?: InvoiceOption[];
}

interface Emits {
  (e: 'update:modelValue', value: ReceiptAllocationPayload[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  customerId: 0,
  availableInvoices: () => [],
});

const emit = defineEmits<Emits>();
const { t } = useI18n();

// Debug: Log availableInvoices prop changes
watch(
  () => props.availableInvoices,
  (newVal) => {
    console.log('[AllocationEditor] availableInvoices prop changed:', newVal);
    console.log('[AllocationEditor] availableInvoices length:', newVal?.length || 0);
  },
  { immediate: true, deep: true },
);

// Local state for editing
const localAllocations = ref<LocalAllocation[]>([]);

// Sync with parent
watch(
  () => props.modelValue,
  (newVal) => {
    localAllocations.value = newVal.map((alloc) => ({
      invoice_id: alloc.invoice_id,
      amount: alloc.amount,
    }));
  },
  { immediate: true, deep: true },
);

watch(
  localAllocations,
  (newVal) => {
    // Filter out allocations without invoice_id and convert to ReceiptAllocationPayload
    const validAllocations: ReceiptAllocationPayload[] = newVal
      .filter((alloc): alloc is LocalAllocation & { invoice_id: number } => 
        alloc.invoice_id !== undefined && alloc.invoice_id !== null
      )
      .map((alloc) => ({
        invoice_id: alloc.invoice_id,
        amount: alloc.amount,
      }));
    emit('update:modelValue', validAllocations);
  },
  { deep: true },
);

// Reset allocations when customer changes
watch(
  () => props.customerId,
  () => {
    localAllocations.value = [];
  },
);

// Table columns
const columns = computed<QTableProps['columns']>(() => [
  {
    name: 'invoice_id',
    label: t('ar.invoice.invoice_no'),
    field: 'invoice_id',
    align: 'left' as const,
    style: 'width: 40%',
  },
  {
    name: 'amount',
    label: t('ar.receipt.amount'),
    field: 'amount',
    align: 'right' as const,
    style: 'width: 30%',
  },
  {
    name: 'actions',
    label: '',
    field: 'actions',
    align: 'center' as const,
    style: 'width: 80px',
  },
]);

// Computed
const totalAllocated = computed(() => {
  return localAllocations.value.reduce((sum, alloc) => sum + (alloc.amount || 0), 0);
});

const unallocatedAmount = computed(() => {
  return props.receiptAmount - totalAllocated.value;
});

// Cache for invoice lookup
const invoiceCache = computed(() => {
  const cache = new Map<number, InvoiceOption>();
  props.availableInvoices.forEach((inv) => cache.set(inv.id, inv));
  return cache;
});

const getInvoiceByIdCached = (invoiceId: number): InvoiceOption | undefined => {
  return invoiceCache.value.get(invoiceId);
};

// Get available invoices for a specific row (exclude already allocated)
const getAvailableInvoicesForRow = (row: LocalAllocation): InvoiceOption[] => {
  console.log('[AllocationEditor] getAvailableInvoicesForRow called with row:', row);
  console.log('[AllocationEditor] props.availableInvoices:', props.availableInvoices);
  console.log('[AllocationEditor] props.availableInvoices length:', props.availableInvoices?.length || 0);
  
  if (!props.availableInvoices || props.availableInvoices.length === 0) {
    console.log('[AllocationEditor] No available invoices, returning empty array');
    return [];
  }
  
  const allocatedIds = localAllocations.value
    .filter((a) => a !== row)
    .map((a) => a.invoice_id)
    .filter((id): id is number => id !== undefined && id !== null);

  console.log('[AllocationEditor] allocatedIds:', allocatedIds);

  const available = props.availableInvoices.filter((inv) => !allocatedIds.includes(inv.id));
  console.log('[AllocationEditor] Available invoices for row:', available);
  
  return available;
};

// Get max allowed amount for allocation (cannot exceed invoice open amount)
const getMaxAllowedAmount = (row: LocalAllocation): number => {
  if (!row.invoice_id) return 0;
  const invoice = getInvoiceByIdCached(row.invoice_id);
  if (!invoice) return 0;
  return parseFloat(invoice.open_amount);
};

// Methods
const addAllocation = () => {
  localAllocations.value.push({
    amount: 0,
  } as LocalAllocation);
};

const removeAllocation = (index: number) => {
  localAllocations.value.splice(index, 1);
};

const onInvoiceChange = (row: LocalAllocation) => {
  if (row.invoice_id) {
    const invoice = getInvoiceByIdCached(row.invoice_id);
    if (invoice) {
      // Auto-fill with remaining open amount or unallocated amount, whichever is less
      const openAmount = parseFloat(invoice.open_amount);
      const remaining = unallocatedAmount.value + (row.amount || 0);
      row.amount = Math.min(openAmount, remaining);
    }
  }
};
</script>

<style scoped>
.rounded-borders {
  border-radius: 8px;
}
</style>

<template>
  <q-table
    flat
    bordered
    :rows="items"
    :columns="columns"
    row-key="id"
    :loading="loading"
    hide-pagination
  >
    <template #body-cell-product="props">
      <q-td :props="props">
        <div class="text-weight-medium">{{ props.row.product?.name || '-' }}</div>
        <div class="text-caption text-grey-7">{{ props.row.product?.sku || '-' }}</div>
      </q-td>
    </template>

    <template #body-cell-warehouse="props">
      <q-td :props="props">
        <q-select
          v-if="editable && warehouseOptions.length > 0"
          :model-value="props.row.warehouse_id"
          :options="getWarehouseOptionsWithStock(props.row)"
          option-label="label"
          option-value="id"
          emit-value
          map-options
          dense
          outlined
          clearable
          @update:model-value="handleWarehouseChange(props.rowIndex, $event)"
        >
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.name }}</q-item-label>
                <q-item-label caption>
                  <span :class="getStockClass(scope.opt.stock)">
                    ยอดคงเหลือ: {{ formatStock(scope.opt.stock) }}
                  </span>
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
          <template #selected>
            <span v-if="props.row.warehouse">
              {{ props.row.warehouse.name }}
              <span
                v-if="getStockForWarehouse(props.row, props.row.warehouse_id)"
                class="text-caption text-grey-7 q-ml-xs"
              >
                (คงเหลือ: {{ formatStock(getStockForWarehouse(props.row, props.row.warehouse_id)) }})
              </span>
            </span>
            <span v-else>-</span>
          </template>
        </q-select>
        <span v-else>
          {{ props.row.warehouse?.name || '-' }}
          <span
            v-if="props.row.warehouse && getStockForWarehouse(props.row, props.row.warehouse.id)"
            class="text-caption text-grey-7 q-ml-xs"
          >
            (คงเหลือ: {{ formatStock(getStockForWarehouse(props.row, props.row.warehouse.id)) }})
          </span>
        </span>
      </q-td>
    </template>

    <template #body-cell-qty="props">
      <q-td :props="props" class="text-right">
        {{ props.value }}
      </q-td>
    </template>

    <template #body-cell-price="props">
      <q-td :props="props" class="text-right">
        {{ formatCurrency(props.value) }}
      </q-td>
    </template>

    <template #body-cell-discount="props">
      <q-td :props="props" class="text-right">
        {{ formatCurrency(props.value || 0) }}
      </q-td>
    </template>

    <template #body-cell-total="props">
      <q-td :props="props" class="text-right text-weight-medium">
        {{ formatCurrency(props.value || 0) }}
      </q-td>
    </template>

    <template #body-cell-actions="props">
      <q-td :props="props" v-if="editable">
        <q-btn
          flat
          dense
          round
          color="negative"
          icon="delete"
          @click="$emit('remove', props.rowIndex)"
        />
      </q-td>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QTableProps } from 'quasar';
import type { QuotationItem } from '@/types/sales';
import { formatCurrency } from '@/types/ar/common';
import type { Warehouse } from '@/services/sales/api';

interface Props {
  items: QuotationItem[];
  loading?: boolean;
  editable?: boolean;
  warehouseOptions?: Warehouse[];
}

const props = withDefaults(defineProps<Props>(), {
  warehouseOptions: () => [],
});

const emit = defineEmits<{
  remove: [index: number];
  'update:warehouse': [index: number, warehouseId: number | null];
}>();

interface WarehouseOption extends Warehouse {
  label: string;
  stock?: number | undefined;
}

const handleWarehouseChange = (index: number, warehouseId: number | null) => {
  emit('update:warehouse', index, warehouseId);
};

const getStockForWarehouse = (
  item: QuotationItem,
  warehouseId: number | null | undefined,
): number | null => {
  if (!warehouseId || !item.product?.warehouseStocks) {
    return null;
  }
  const stock = item.product.warehouseStocks.find((ws) => ws.warehouseId === warehouseId);
  return stock?.quantity ?? null;
};

const getWarehouseOptionsWithStock = (item: QuotationItem): WarehouseOption[] => {
  return props.warehouseOptions.map((warehouse) => {
    const stock = getStockForWarehouse(item, warehouse.id);
    return {
      ...warehouse,
      label: warehouse.name,
      stock: stock ?? undefined,
    };
  });
};

const formatStock = (stock: number | null | undefined): string => {
  if (stock === null || stock === undefined) {
    return '-';
  }
  return stock.toLocaleString('th-TH');
};

const getStockClass = (stock: number | undefined): string => {
  if (stock === undefined) {
    return 'text-grey-6';
  }
  if (stock === 0) {
    return 'text-negative';
  }
  if (stock < 10) {
    return 'text-warning';
  }
  return 'text-positive';
};

const columns = computed<QTableProps['columns']>(() => {
  const cols: QTableProps['columns'] = [
    {
      name: 'product',
      label: 'สินค้า',
      field: 'product',
      align: 'left',
    },
    {
      name: 'warehouse',
      label: 'คลังสินค้า',
      field: (row: QuotationItem) => row.warehouse?.name || '-',
      align: 'left',
    },
    {
      name: 'qty',
      label: 'จำนวน',
      field: 'qty',
      align: 'right',
    },
    {
      name: 'price',
      label: 'ราคา',
      field: 'price',
      align: 'right',
    },
    {
      name: 'discount',
      label: 'ส่วนลด',
      field: 'discount',
      align: 'right',
    },
    {
      name: 'total',
      label: 'รวม',
      field: 'total',
      align: 'right',
    },
  ];
  if (props.editable) {
    cols.push({
      name: 'actions',
      label: '',
      field: '',
      align: 'center',
    });
  }
  return cols;
});
</script>


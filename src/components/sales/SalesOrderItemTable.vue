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
          v-if="editable && warehouseOptions && warehouseOptions.length > 0"
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
        <q-input
          v-if="editable"
          :model-value="props.value"
          type="number"
          min="1"
          dense
          outlined
          class="qty-input"
          style="width: 80px"
          @update:model-value="handleQtyChange(props.rowIndex, $event)"
        />
        <span v-else>{{ props.value }}</span>
      </q-td>
    </template>

    <template #body-cell-delivered_qty="props">
      <q-td :props="props" class="text-right">
        <span :class="getDeliveredQtyClass(props.row)">
          {{ props.row.delivered_qty || 0 }}
        </span>
      </q-td>
    </template>

    <template #body-cell-backorder_qty="props">
      <q-td :props="props" class="text-right">
        <q-badge
          v-if="(props.row.backorder_qty || 0) > 0"
          color="warning"
          :label="props.row.backorder_qty"
        />
        <span v-else class="text-grey-6">0</span>
      </q-td>
    </template>

    <template #body-cell-price="props">
      <q-td :props="props" class="text-right">
        <q-input
          v-if="editable"
          :model-value="props.value"
          type="number"
          min="0"
          step="0.01"
          dense
          outlined
          class="price-input"
          style="width: 120px"
          @update:model-value="handlePriceChange(props.rowIndex, $event)"
        />
        <span v-else>{{ formatCurrency(props.value) }}</span>
      </q-td>
    </template>

    <template #body-cell-discount="props">
      <q-td :props="props" class="text-right">
        <q-input
          v-if="editable"
          :model-value="props.value || 0"
          type="number"
          min="0"
          step="0.01"
          dense
          outlined
          class="discount-input"
          style="width: 120px"
          @update:model-value="handleDiscountChange(props.rowIndex, $event)"
        />
        <span v-else>{{ formatCurrency(props.value || 0) }}</span>
      </q-td>
    </template>

    <template #body-cell-total="props">
      <q-td :props="props" class="text-right text-weight-medium">
        {{ formatCurrency(props.value || 0) }}
      </q-td>
    </template>

    <template #body-cell-stock_status="props">
      <q-td :props="props" class="text-center">
        <q-badge
          v-if="props.row.stock_status"
          :color="getStockStatusColor(props.row.stock_status)"
          :label="getStockStatusLabel(props.row.stock_status)"
        />
        <span v-else class="text-grey-6">-</span>
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
import type { SalesOrderItem } from '@/types/sales';
import { formatCurrency } from '@/types/ar/common';
import type { Warehouse } from '@/services/sales/api';

interface Props {
  items: SalesOrderItem[];
  loading?: boolean;
  editable?: boolean;
  showStockStatus?: boolean;
  warehouseOptions?: Warehouse[];
}

interface StockStatus {
  available: number;
  required: number;
  status: 'available' | 'low' | 'insufficient';
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  editable: false,
  showStockStatus: true,
  warehouseOptions: () => [],
});

const emit = defineEmits<{
  remove: [index: number];
  update: [index: number, updates: { qty?: number; price?: number; discount?: number }];
  'update:warehouse': [index: number, warehouseId: number | null];
}>();

interface WarehouseOption extends Warehouse {
  label: string;
  stock?: number | undefined;
}

const handleQtyChange = (index: number, qty: string | number | null | undefined) => {
  const numQty = typeof qty === 'string' ? Number(qty) : qty;
  if (numQty !== null && numQty !== undefined && !Number.isNaN(numQty) && numQty >= 1) {
    emit('update', index, { qty: numQty });
  }
};

const handlePriceChange = (index: number, price: string | number | null | undefined) => {
  const numPrice = typeof price === 'string' ? Number(price) : price;
  if (numPrice !== null && numPrice !== undefined && !Number.isNaN(numPrice) && numPrice >= 0) {
    emit('update', index, { price: numPrice });
  }
};

const handleDiscountChange = (index: number, discount: string | number | null | undefined) => {
  const numDiscount = typeof discount === 'string' ? Number(discount) : discount;
  if (numDiscount !== null && numDiscount !== undefined && !Number.isNaN(numDiscount) && numDiscount >= 0) {
    emit('update', index, { discount: numDiscount });
  }
};

const getStockStatusColor = (status: StockStatus): string => {
  if (status.status === 'insufficient') return 'negative';
  if (status.status === 'low') return 'warning';
  return 'positive';
};

const getStockStatusLabel = (status: StockStatus): string => {
  if (status.status === 'insufficient') {
    return `ไม่พอ (${status.available}/${status.required})`;
  }
  if (status.status === 'low') {
    return `ต่ำ (${status.available}/${status.required})`;
  }
  return `พอ (${status.available})`;
};

const getDeliveredQtyClass = (item: SalesOrderItem): string => {
  const delivered = item.delivered_qty || 0;
  const qty = item.qty;
  if (delivered >= qty) return 'text-positive text-weight-medium';
  if (delivered > 0) return 'text-warning';
  return '';
};

const handleWarehouseChange = (index: number, warehouseId: number | null) => {
  emit('update:warehouse', index, warehouseId);
};

const getStockForWarehouse = (
  item: SalesOrderItem,
  warehouseId: number | null | undefined,
): number | null => {
  if (!warehouseId || !item.product?.warehouseStocks) {
    return null;
  }
  const stock = item.product.warehouseStocks.find((ws) => ws.warehouseId === warehouseId);
  return stock?.quantity ?? null;
};

const getWarehouseOptionsWithStock = (item: SalesOrderItem): WarehouseOption[] => {
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
      field: (row: SalesOrderItem) => row.warehouse?.name || '-',
      align: 'left',
    },
    {
      name: 'qty',
      label: 'จำนวน',
      field: 'qty',
      align: 'right',
    },
    {
      name: 'delivered_qty',
      label: 'จัดส่งแล้ว',
      field: (row: SalesOrderItem) => row.delivered_qty || 0,
      align: 'right',
    },
    {
      name: 'backorder_qty',
      label: 'ค้างส่ง',
      field: (row: SalesOrderItem) => row.backorder_qty || 0,
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

  if (props.showStockStatus) {
    cols.push({
      name: 'stock_status',
      label: 'สถานะสต็อก',
      field: 'stock_status',
      align: 'center',
    });
  }

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


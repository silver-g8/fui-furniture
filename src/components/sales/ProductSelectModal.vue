<template>
  <q-dialog :model-value="modelValue" @update:model-value="(val) => $emit('update:modelValue', val)">
    <q-card style="min-width: 700px; max-width: 900px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">เลือกสินค้า</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="search"
          label="ค้นหาสินค้า (รหัส / ชื่อ)"
          outlined
          dense
          clearable
          debounce="400"
          @update:model-value="handleSearch"
        >
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-table
          flat
          :rows="products"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :rows-per-page-options="[10, 20, 50]"
          @request="onRequest"
          v-model:pagination="tablePagination"
          hide-pagination
        >
          <template #body-cell-imageUrl="props">
            <q-td :props="props">
              <q-avatar v-if="props.value" size="40px">
                <img :src="props.value" :alt="props.row.name" />
              </q-avatar>
              <q-avatar v-else size="40px" color="grey-3" text-color="grey-7">
                <q-icon name="image" />
              </q-avatar>
            </q-td>
          </template>

          <template #body-cell-priceTagged="props">
            <q-td :props="props" class="text-right">
              <div v-if="getPriceInfo(props.row.id)">
                <div class="text-weight-medium">
                  {{ formatCurrency(getPriceInfo(props.row.id)?.price || props.value || 0) }}
                </div>
                <div v-if="getPriceInfo(props.row.id)?.hasSpecialPrice" class="text-caption text-positive">
                  <q-icon name="star" size="xs" />
                  ราคาพิเศษสำหรับ {{ getCustomerGroupLabel(getPriceInfo(props.row.id)?.customerGroup) }}
                </div>
                <div v-else-if="getPriceInfo(props.row.id)" class="text-caption text-grey-6">
                  ราคาปกติ
                </div>
              </div>
              <div v-else>
                {{ formatCurrency(props.value || 0) }}
              </div>
            </q-td>
          </template>

          <template #body-cell-onHand="props">
            <q-td :props="props" class="text-right">
              <q-badge
                :color="props.value > 0 ? 'positive' : 'negative'"
                :label="props.value"
              />
            </q-td>
          </template>

          <template #body-cell-stock_info="props">
            <q-td :props="props" class="text-right">
              <div class="column q-gutter-xs">
                <div class="text-caption">
                  <span class="text-weight-medium">คงเหลือ:</span>
                  <q-badge
                    :color="props.row.onHand > 0 ? 'positive' : 'negative'"
                    :label="props.row.onHand"
                    class="q-ml-xs"
                  />
                </div>
                <div class="text-caption text-grey-6">
                  <span class="text-weight-medium">จอง:</span>
                  <span class="q-ml-xs">—</span>
                </div>
                <div class="text-caption">
                  <span class="text-weight-medium">ใช้ได้:</span>
                  <q-badge
                    :color="getAvailableQtyColor(props.row.onHand)"
                    :label="getAvailableQty(props.row.onHand)"
                    class="q-ml-xs"
                  />
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                dense
                color="primary"
                label="เลือก"
                @click="selectProduct(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { QTableProps } from 'quasar';
import { fetchProducts, getProductPrice, type ProductPriceInfo } from '@/services/catalog/product.service';
import type { Product, ListParams } from '@/types/catalog';
import type { ApiListResponse } from '@/types/catalog';
import type { Customer } from '@/services/sales/api';
import { formatCurrency } from '@/types/ar/common';

interface Props {
  modelValue: boolean;
  customer: Customer | null | undefined;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'selected', product: Product): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const search = ref('');
const products = ref<Product[]>([]);
const loading = ref(false);
const priceInfoMap = ref<Map<number, ProductPriceInfo>>(new Map());
const loadingPrices = ref<Set<number>>(new Set());
const tablePagination = ref<QTableProps['pagination']>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const columns: QTableProps['columns'] = [
  {
    name: 'imageUrl',
    label: '',
    field: 'imageUrl',
    align: 'center',
    style: 'width: 60px',
  },
  {
    name: 'sku',
    label: 'รหัสสินค้า',
    field: 'sku',
    align: 'left',
    sortable: true,
  },
  {
    name: 'name',
    label: 'ชื่อสินค้า',
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'priceTagged',
    label: 'ราคา',
    field: 'priceTagged',
    align: 'right',
  },
  {
    name: 'onHand',
    label: 'สต็อก',
    field: 'onHand',
    align: 'right',
  },
  {
    name: 'stock_info',
    label: 'ข้อมูลสต็อก',
    field: 'stock_info',
    align: 'right',
  },
  {
    name: 'actions',
    label: '',
    field: '',
    align: 'center',
  },
];

const loadProducts = async () => {
  loading.value = true;
  try {
    const params: ListParams = {
      status: 'active',
      page: tablePagination.value?.page || 1,
      perPage: tablePagination.value?.rowsPerPage || 10,
    };
    if (search.value?.trim()) {
      params.search = search.value.trim();
    }
    const response: ApiListResponse<Product> = await fetchProducts(params);
    products.value = response.data || [];
    if (tablePagination.value) {
      tablePagination.value.rowsNumber = response.meta?.total || 0;
    }

    // Load prices if customer is selected
    if (props.customer?.id) {
      void loadPricesForProducts(products.value);
    }
  } catch (error) {
    console.error('Failed to load products:', error);
    products.value = [];
  } finally {
    loading.value = false;
  }
};

const loadPricesForProducts = async (productsToLoad: Product[]) => {
  if (!props.customer?.id) return;

  for (const product of productsToLoad) {
    if (loadingPrices.value.has(product.id)) continue;

    loadingPrices.value.add(product.id);
    try {
      const priceInfo = await getProductPrice(product.id, props.customer.id, 1);
      priceInfoMap.value.set(product.id, priceInfo);
    } catch (error) {
      console.error(`Failed to load price for product ${product.id}:`, error);
    } finally {
      loadingPrices.value.delete(product.id);
    }
  }
};

const getPriceInfo = (productId: number): ProductPriceInfo | undefined => {
  return priceInfoMap.value.get(productId);
};

const getCustomerGroupLabel = (group: string | null | undefined): string => {
  if (!group) return 'ไม่ระบุ';
  const labels: Record<string, string> = {
    personal: 'บุคคลธรรมดา',
    government: 'ข้าราชการ / หน่วยงานรัฐ',
    organization: 'องค์กร / บริษัท',
  };
  return labels[group] || group;
};

const onRequest: QTableProps['onRequest'] = ({ pagination }) => {
  if (pagination) {
    tablePagination.value = pagination;
    void loadProducts();
  }
};

const handleSearch = () => {
  if (tablePagination.value) {
    tablePagination.value.page = 1;
  }
  void loadProducts();
};

const getAvailableQty = (onHand: number): number => {
  return Math.max(0, onHand);
};

const getAvailableQtyColor = (onHand: number): string => {
  if (onHand === 0) return 'negative';
  if (onHand < 10) return 'warning';
  return 'positive';
};

const selectProduct = (product: Product) => {
  emit('selected', product);
  emit('update:modelValue', false);
};

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    void loadProducts();
  }
});

watch(() => props.customer?.id, () => {
  // Reload prices when customer changes
  priceInfoMap.value.clear();
  if (products.value.length > 0 && props.customer?.id) {
    void loadPricesForProducts(products.value);
  }
});
</script>


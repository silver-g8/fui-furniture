<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">
            {{ product?.name ?? t('catalog.products.detailTitle') }}
          </div>
          <q-badge v-if="product" :color="statusColor(product.status)">
            {{ statusLabel(product.status) }}
          </q-badge>
        </div>
        <div class="row q-gutter-sm">
          <q-btn
            flat
            color="primary"
            icon="edit"
            :label="t('catalog.products.actions.edit')"
            @click="goToEdit"
          />
          <q-btn
            flat
            color="primary"
            icon="arrow_back"
            :label="t('catalog.products.actions.cancel')"
            @click="goBack"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="productsLoading" class="q-pa-lg flex flex-center">
        <q-spinner size="42px" color="primary" />
      </q-card-section>

      <q-card-section v-else>
        <q-tabs v-model="tab" dense class="text-primary">
          <q-tab name="overview" :label="t('catalog.products.tabs.overview')" />
          <q-tab name="stock" :label="t('catalog.products.tabs.stock')" />
          <q-tab name="activity" :label="t('catalog.products.tabs.activity')" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="overview">
            <div v-if="!product" class="text-grey-6">
              {{ t('catalog.products.empty.title') }}
            </div>
            <div v-else class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <div class="q-mb-md">
                  <div class="text-subtitle2 q-mb-sm text-grey-7">
                    {{ t('catalog.products.table.imageUrl') }}
                  </div>
                  <div
                    v-if="product.imageUrl && product.imageUrl.trim()"
                    class="product-detail-image-container"
                  >
                    <q-img
                      :src="product.imageUrl"
                      class="product-detail-image cursor-pointer"
                      ratio="4/3"
                      :alt="product.name"
                      spinner-color="primary"
                      fit="contain"
                      @click="openImageDialogFromDetail"
                      data-test="product-image-thumb"
                    >
                      <template v-slot:error>
                        <div class="absolute-full flex flex-center bg-negative text-white">
                          <div class="text-center">
                            <q-icon name="broken_image" size="48px" class="q-mb-sm" />
                            <div>{{ t('catalog.products.errors.imageLoadError') }}</div>
                            <div class="text-caption q-mt-sm">{{ product.imageUrl }}</div>
                          </div>
                        </div>
                      </template>
                      <template v-slot:loading>
                        <div class="absolute-full flex flex-center bg-grey-2">
                          <q-spinner color="primary" size="48px" />
                          <div class="text-body2 q-mt-md text-grey-7">กำลังโหลดรูปภาพ...</div>
                        </div>
                      </template>
                    </q-img>
                  </div>
                  <div v-else class="product-detail-placeholder column items-center justify-center">
                    <q-icon name="image_not_supported" size="64px" class="text-grey-5 q-mb-sm" />
                    <span class="text-body2 text-grey-6">
                      {{ t('catalog.products.empty.image') }}
                    </span>
                  </div>
                </div>
                <q-list bordered padding>
                  <q-item>
                    <q-item-section>
                      <q-item-label overline>{{ t('catalog.products.fields.sku') }}</q-item-label>
                      <q-item-label>{{ product.sku }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label overline>{{
                        t('catalog.products.fields.category')
                      }}</q-item-label>
                      <q-item-label>{{ product.category?.name ?? '—' }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label overline>{{ t('catalog.products.fields.brand') }}</q-item-label>
                      <q-item-label>{{ product.brand?.name ?? '—' }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label overline>{{ t('catalog.products.fields.price') }}</q-item-label>
                      <q-item-label>{{ formatCurrency(product.priceTagged ?? 0) }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label overline>{{ t('catalog.products.table.onHand') }}</q-item-label>
                      <q-item-label>{{ product.onHand }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
              <div class="col-12 col-md-6">
                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-subtitle1">{{ t('catalog.products.fields.description') }}</div>
                    <div class="text-body2 q-mt-sm">
                      {{ product.description ?? '—' }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="stock">
            <div class="q-mb-md">
              <div class="text-subtitle2 q-mb-sm text-grey-7">
                {{ t('catalog.stock.sections.warehouseStocks') }}
              </div>
              <q-table
                v-if="warehouseStockRows.length"
                dense
                flat
                :rows="warehouseStockRows"
                :columns="warehouseStockColumns"
                row-key="warehouseId"
                :rows-per-page-options="[5, 10, 20]"
                :loading="warehouseStocksLoading"
              />
              <div v-else-if="warehouseStocksLoading" class="text-center q-pa-md">
                <q-spinner size="24px" color="primary" />
              </div>
              <div v-else class="text-grey-6">
                {{ t('catalog.stock.empty.warehouseStocks') }}
              </div>
            </div>

            <q-separator class="q-mb-md" />

            <div>
              <div class="text-subtitle2 q-mb-sm text-grey-7">
                {{ t('catalog.stock.sections.movements') }}
              </div>
              <q-table
                v-if="stockRows.length"
                dense
                flat
                :rows="stockRows"
                :columns="stockColumns"
                row-key="id"
                :rows-per-page-options="[10, 20, 50]"
                :loading="stockMovementsLoading"
                v-model:pagination="stockMovementsPagination"
                @request="onStockMovementsRequest"
              >
                <template #body-cell-type="props">
                  <q-td :props="props">
                    <q-badge :color="getMovementTypeColor(props.value)">
                      {{ t(`catalog.stock.types.${props.value}`) }}
                    </q-badge>
                  </q-td>
                </template>
              </q-table>
              <div v-else-if="stockMovementsLoading" class="text-center q-pa-md">
                <q-spinner size="24px" color="primary" />
              </div>
              <div v-else class="text-grey-6">
                {{ t('catalog.stock.empty.movements') }}
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="activity">
            <q-banner dense rounded class="bg-grey-1 text-grey-7">
              {{ t('catalog.products.tabs.activity') }}
            </q-banner>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>

    <!-- Image Dialog -->
    <q-dialog v-model="isImageDialogOpen" data-test="product-image-dialog">
      <q-card style="min-width: 500px; max-width: 800px">
        <!-- Header: SKU และชื่อสินค้า -->
        <q-card-section class="product-dialog-header">
          <div class="text-h6 q-mb-xs">{{ product?.name ?? '' }}</div>
          <div class="text-body2 text-grey-7">
            <span class="q-mr-md">
              <strong>{{ t('catalog.products.fields.sku') }}:</strong> {{ product?.sku ?? '—' }}
            </span>
          </div>
        </q-card-section>

        <q-separator />

        <!-- Middle: รูปภาพ -->
        <q-card-section class="q-pa-none">
          <div
            v-if="selectedImageUrl && selectedImageUrl.trim()"
            class="product-dialog-image-container"
          >
            <q-img
              :src="selectedImageUrl"
              ratio="4/3"
              spinner-color="primary"
              :alt="product?.name ?? ''"
              class="product-dialog-image"
              fit="contain"
              no-native-menu
            >
              <template v-slot:error>
                <div class="absolute-full flex flex-center bg-negative text-white">
                  <div class="text-center">
                    <q-icon name="broken_image" size="48px" class="q-mb-sm" />
                    <div>{{ t('catalog.products.errors.imageLoadError') }}</div>
                  </div>
                </div>
              </template>
              <template v-slot:loading>
                <div class="absolute-full flex flex-center bg-grey-2">
                  <q-spinner color="primary" size="48px" />
                  <div class="text-body2 q-mt-md text-grey-7">กำลังโหลดรูปภาพ...</div>
                </div>
              </template>
            </q-img>
          </div>
          <div v-else class="product-dialog-placeholder column items-center justify-center">
            <q-icon name="image_not_supported" size="64px" class="text-grey-5 q-mb-sm" />
            <span class="text-body2 text-grey-6">
              {{ t('catalog.products.empty.image') }}
            </span>
          </div>
        </q-card-section>

        <q-separator />

        <!-- Footer: รายละเอียด -->
        <q-card-section>
          <div class="text-subtitle1 q-mb-sm">
            {{ t('catalog.products.fields.description') }}
          </div>
          <div class="text-body2" data-test="product-image-description">
            {{ selectedDescription || t('catalog.products.empty.description') }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup :label="t('catalog.common.buttons.close')" color="primary" flat />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { QTableProps } from 'quasar';
import type { ProductStatus, ProductWarehouseStock, StockMovement } from '@/types/catalog';
import { useNotifier } from '@/composables/useNotifier';
import { useLoadingOverlay } from '@/composables/useLoadingOverlay';
import { useProducts } from '@/composables/useProducts';
import { getProductStockSummary } from '@/services/catalog/product.service';
import { getProductStockMovements } from '@/services/catalog/stock.service';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { current, loading: productsLoading, fetchProduct, resetCurrent } = useProducts();
const { error: notifyError } = useNotifier();
const { withLoading } = useLoadingOverlay();

const tab = ref<'overview' | 'stock' | 'activity'>('overview');
const productId = Number(route.params.id);

const product = computed(() => current.value);

// Warehouse stocks state
const warehouseStocksData = ref<ProductWarehouseStock[]>([]);
const warehouseStocksLoading = ref(false);

// Stock movements state
const stockMovementsData = ref<StockMovement[]>([]);
const stockMovementsLoading = ref(false);
const stockMovementsPagination = ref<QTableProps['pagination']>({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});

// Image dialog state
const isImageDialogOpen = ref(false);
const selectedImageUrl = ref<string | null>(null);
const selectedDescription = ref<string | null>(null);

const statusLabel = (status: ProductStatus) => t(`catalog.products.status.${status}`);
const statusColor = (status: ProductStatus) => {
  switch (status) {
    case 'active':
      return 'positive';
    case 'inactive':
      return 'grey';
    case 'archived':
      return 'negative';
    default:
      return 'warning';
  }
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(value ?? 0);

const warehouseStockRows = computed(() => warehouseStocksData.value);

const warehouseStockColumns = computed(() => [
  {
    name: 'warehouse',
    label: t('catalog.stock.fields.warehouse'),
    field: 'warehouseName',
  },
  {
    name: 'code',
    label: t('catalog.stock.fields.warehouseCode'),
    field: 'warehouseCode',
  },
  {
    name: 'quantity',
    label: t('catalog.stock.fields.onHand'),
    field: 'quantity',
  },
]);

const stockRows = computed(() => stockMovementsData.value);

const stockColumns = computed(() => [
  {
    name: 'createdAt',
    label: t('catalog.stock.table.date'),
    field: (row: StockMovement) => new Date(row.createdAt).toLocaleString(),
  },
  {
    name: 'type',
    label: t('catalog.stock.fields.type'),
    field: 'type',
  },
  {
    name: 'quantity',
    label: t('catalog.stock.fields.quantity'),
    field: 'quantity',
  },
  {
    name: 'warehouse',
    label: t('catalog.stock.fields.warehouse'),
    field: (row: StockMovement) => row.warehouseName ?? row.warehouseId,
  },
  {
    name: 'balanceAfter',
    label: t('catalog.stock.fields.balanceAfter'),
    field: (row: StockMovement) => row.balanceAfter ?? '—',
  },
  {
    name: 'reason',
    label: t('catalog.stock.fields.reason'),
    field: (row: StockMovement) => row.reason ?? '—',
  },
]);

const getMovementTypeColor = (type: string): 'positive' | 'negative' => {
  return type.endsWith('_in') ? 'positive' : 'negative';
};

const load = async () => {
  try {
    await withLoading(() => fetchProduct(productId), {
      message: t('catalog.common.loading'),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : t('catalog.products.notify.loadError');
    notifyError({ message });
  }
};

const loadWarehouseStocks = async () => {
  warehouseStocksLoading.value = true;
  try {
    warehouseStocksData.value = await getProductStockSummary(productId);
  } catch (error) {
    const message = error instanceof Error ? error.message : t('catalog.products.notify.loadError');
    notifyError({ message });
    warehouseStocksData.value = [];
  } finally {
    warehouseStocksLoading.value = false;
  }
};

const loadStockMovements = async (page = 1) => {
  stockMovementsLoading.value = true;
  try {
    const { data, meta } = await getProductStockMovements(productId, {
      page,
      perPage: (stockMovementsPagination.value?.rowsPerPage as number) ?? 20,
    });
    stockMovementsData.value = data;
    stockMovementsPagination.value = {
      ...stockMovementsPagination.value,
      page: meta.page ?? 1,
      rowsPerPage: meta.perPage ?? 20,
      rowsNumber: meta.total ?? 0,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : t('catalog.products.notify.loadError');
    notifyError({ message });
    stockMovementsData.value = [];
  } finally {
    stockMovementsLoading.value = false;
  }
};

const onStockMovementsRequest: QTableProps['onRequest'] = ({ pagination }) => {
  if (!pagination) return;
  const page = pagination.page ?? 1;
  void loadStockMovements(page);
};

// Watch tab changes to load warehouse stocks and stock movements when stock tab is opened
watch(
  tab,
  (newTab) => {
    if (newTab === 'stock' && productId && !isNaN(productId)) {
      void loadWarehouseStocks();
      void loadStockMovements();
    }
  },
  { immediate: true },
);

const goToEdit = () => {
  void router.push({ name: 'catalog-products-edit', params: { id: productId } });
};

const goBack = () => {
  router.back();
};

const openImageDialogFromDetail = () => {
  if (!product.value?.imageUrl) return;
  // Trim and validate imageUrl
  const imageUrl = product.value.imageUrl?.trim();
  if (imageUrl && imageUrl.length > 0) {
    selectedImageUrl.value = imageUrl;
  } else {
    selectedImageUrl.value = null;
  }
  selectedDescription.value = product.value.description ?? '';
  isImageDialogOpen.value = true;
};

onMounted(() => {
  void load();
});

onBeforeUnmount(() => {
  resetCurrent();
});
</script>

<style scoped>
.product-detail-image-container {
  width: 100%;
  min-height: 240px;
  background-color: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  padding: 12px 0;
}

.product-detail-image {
  width: 100%;
  min-height: 240px;
  display: block;
  object-fit: contain;
  margin: 0 auto;
}

.product-detail-placeholder {
  min-height: 240px;
  padding: 48px;
  border: 2px dashed #d5d5d5;
  border-radius: 8px;
  background-color: #f5f5f5;
}

.product-dialog-header {
  background-color: #fafafa;
  border-bottom: 1px solid #e0e0e0;
}

.product-dialog-image-container {
  width: 100%;
  min-height: 300px;
  background-color: #fafafa;
  overflow: hidden;
}

.product-dialog-image {
  max-height: 60vh;
  width: 100%;
  min-height: 300px;
  display: block;
  object-fit: contain;
}

.product-dialog-placeholder {
  min-height: 300px;
  padding: 48px;
  background-color: #f5f5f5;
  border-radius: 8px 8px 0 0;
}
</style>

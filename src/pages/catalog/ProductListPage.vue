<template>
  <q-page padding>
    <q-card flat bordered class="catalog-card">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">{{ t('catalog.products.listTitle') }}</div>
          <div class="text-subtitle2 text-grey-7">
            {{ t('catalog.products.title') }}
          </div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn
            color="primary"
            icon="add"
            :label="t('catalog.products.actions.create')"
            @click="handleCreate"
          />
          <q-btn
            flat
            color="primary"
            icon="refresh"
            :label="t('catalog.products.actions.refresh')"
            :loading="productsLoading"
            @click="refresh"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="search"
              :label="t('catalog.products.filters.search')"
              outlined
              dense
              clearable
              debounce="400"
            >
              <template #append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="statusFilter"
              :options="statusOptions"
              emit-value
              map-options
              outlined
              dense
              clearable
              :label="t('catalog.products.filters.status')"
            />
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="categoryFilter"
              :options="categoryOptions"
              emit-value
              map-options
              outlined
              dense
              clearable
              :label="t('catalog.products.filters.category')"
              :disable="!categoryOptions.length"
            />
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="brandFilter"
              :options="brandOptions"
              emit-value
              map-options
              outlined
              dense
              clearable
              :label="t('catalog.products.filters.brand')"
              :disable="!brandOptions.length"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-table
        flat
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="productsLoading"
        v-model:pagination="tablePagination"
        :rows-per-page-options="[10, 20, 50]"
        @request="onRequest"
      >
        <template #body-cell-imageUrl="props">
          <q-td :props="props">
            <q-img
              v-if="props.value"
              :src="props.value"
              class="product-thumb cursor-pointer"
              ratio="1"
              :alt="props.row.name"
              spinner-color="primary"
              @click="openImageDialog(props.row)"
              data-test="product-image-thumb"
            />
            <span v-else class="text-grey-6">—</span>
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="statusColor(props.value)">
              {{ statusLabel(props.value) }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-price="props">
          <q-td :props="props">
            {{ formatCurrency(props.value) }}
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              dense
              flat
              icon="visibility"
              :label="t('catalog.products.actions.view')"
              @click="viewProduct(props.row.id)"
            />
            <q-btn
              dense
              flat
              icon="edit"
              color="primary"
              :label="t('catalog.products.actions.edit')"
              @click="editProduct(props.row.id)"
            />
            <q-btn
              dense
              flat
              icon="inventory_2"
              color="secondary"
              :label="t('catalog.products.actions.adjust')"
              @click="openAdjustDialog(props.row)"
            />
            <q-btn
              dense
              flat
              icon="delete"
              color="negative"
              :label="t('catalog.products.actions.delete')"
              @click="confirmDelete(props.row)"
            />
          </q-td>
        </template>

        <template #no-data>
          <div class="text-center q-pa-lg column items-center">
            <q-icon name="inventory" size="64px" color="grey-5" />
            <div class="text-subtitle1">{{ t('catalog.products.empty.title') }}</div>
            <div class="text-body2 text-grey-6">
              {{ t('catalog.products.empty.description') }}
            </div>
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- Image Dialog -->
    <q-dialog v-model="isImageDialogOpen" data-test="product-image-dialog">
      <q-card style="min-width: 500px; max-width: 800px">
        <!-- Header: SKU และชื่อสินค้า -->
        <q-card-section class="product-dialog-header">
          <div class="text-h6 q-mb-xs">{{ selectedProduct?.name ?? '' }}</div>
          <div class="text-body2 text-grey-7">
            <span class="q-mr-md">
              <strong>{{ t('catalog.products.fields.sku') }}:</strong> {{ selectedProduct?.sku ?? '—' }}
            </span>
          </div>
        </q-card-section>

        <q-separator />

        <!-- Middle: รูปภาพ -->
        <q-card-section class="q-pa-none">
          <div v-if="selectedImageUrl && selectedImageUrl.trim()" class="product-dialog-image-container">
            <q-img
              :src="selectedImageUrl"
              ratio="4/3"
              spinner-color="primary"
              :alt="selectedProduct?.name ?? ''"
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
          <q-btn
            v-close-popup
            :label="t('catalog.common.buttons.close')"
            color="primary"
            flat
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <adjust-stock-dialog
      v-model="adjustDialog"
      :product="selectedProduct"
      :loading="adjusting"
      @cancel="adjustDialog = false"
      @submit="handleAdjustStock"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Dialog } from 'quasar';
import type { QTableProps } from 'quasar';
import AdjustStockDialog from '@/components/catalog/AdjustStockDialog.vue';
import { adjustStock } from '@/services/catalog/stock.service';
import { fetchCategoryList } from '@/services/catalog/category.service';
import { fetchBrands } from '@/services/catalog/brand.service';
import type { Product, ProductStatus, ListParams, StockAdjustPayload } from '@/types/catalog';
import { useTableFilters } from '@/composables/useTableFilters';
import { useNotifier } from '@/composables/useNotifier';
import { useProducts } from '@/composables/useProducts';

interface Option {
  label: string;
  value: number | string;
}

const router = useRouter();
const { t } = useI18n();
const { success: notifySuccess, error: notifyError } = useNotifier();
const {
  items,
  pagination: productPagination,
  loading: productsLoading,
  fetchProducts,
  remove: removeProduct,
} = useProducts();

const { filters, updateFilters, applyFromRoute } = useTableFilters({
  defaults: {
    search: '',
    status: null as ProductStatus | null,
    categoryId: null as number | null,
    brandId: null as number | null,
    page: 1,
    perPage: 10,
    sort: undefined as string | undefined,
    order: undefined as 'asc' | 'desc' | undefined,
  },
  parsers: {
    status: (value) => {
      if (!value) return null;
      const normalized = Array.isArray(value) ? value[0] : value;
      return typeof normalized === 'string' && normalized.length
        ? (normalized as ProductStatus)
        : null;
    },
    categoryId: (value) => (value ? Number(Array.isArray(value) ? value[0] : value) : null),
    brandId: (value) => (value ? Number(Array.isArray(value) ? value[0] : value) : null),
    page: (value) => {
      const parsed = Number(Array.isArray(value) ? value[0] : value);
      return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
    },
    perPage: (value) => {
      const parsed = Number(Array.isArray(value) ? value[0] : value);
      return Number.isNaN(parsed) || parsed < 1 ? 10 : parsed;
    },
    order: (value) => {
      if (!value) return undefined;
      const normalized = Array.isArray(value) ? value[0] : value;
      if (normalized === 'desc' || normalized === 'asc') {
        return normalized;
      }
      return undefined;
    },
    sort: (value) => {
      if (!value) return undefined;
      const normalized = Array.isArray(value) ? value[0] : value;
      return typeof normalized === 'string' && normalized.length ? normalized : undefined;
    },
  },
  serializers: {
    search: (value) => (value ? String(value) : undefined),
    status: (value) => (value ? String(value) : undefined),
    categoryId: (value) => (value !== null && value !== undefined ? String(value) : undefined),
    brandId: (value) => (value !== null && value !== undefined ? String(value) : undefined),
    page: (value) => (value && value !== 1 ? String(value) : undefined),
    perPage: (value) => (value && value !== 10 ? String(value) : undefined),
    sort: (value) => (value ? String(value) : undefined),
    order: (value) => (value ? String(value) : undefined),
  },
  onRouteChange: () => {
    void refresh();
  },
});

const categoryOptions = ref<Option[]>([]);
const brandOptions = ref<Option[]>([]);

const adjustDialog = ref(false);
const selectedProduct = ref<Product | null>(null);
const adjusting = ref(false);

// Image dialog state
const isImageDialogOpen = ref(false);
const selectedImageUrl = ref<string | null>(null);
const selectedDescription = ref<string | null>(null);

const rows = computed(() => items.value);

const search = computed({
  get: () => filters.search ?? '',
  set: (value: string) => {
    updateFilters({ search: value, page: 1 });
    void refresh();
  },
});

const statusFilter = computed<ProductStatus | null>({
  get: () => filters.status ?? null,
  set: (value: ProductStatus | null) => {
    updateFilters({ status: value, page: 1 });
    void refresh();
  },
});

const categoryFilter = computed<number | null>({
  get: () => filters.categoryId ?? null,
  set: (value: number | null) => {
    updateFilters({ categoryId: value, page: 1 });
    void refresh();
  },
});

const brandFilter = computed<number | null>({
  get: () => filters.brandId ?? null,
  set: (value: number | null) => {
    updateFilters({ brandId: value, page: 1 });
    void refresh();
  },
});

const tablePagination = ref<QTableProps['pagination']>({
  page: filters.page ?? 1,
  rowsPerPage: filters.perPage ?? 10,
  rowsNumber: productPagination.value.total,
  sortBy: filters.sort ?? null,
  descending: filters.order === 'desc',
});

watch(
  [
    () => filters.page,
    () => filters.perPage,
    () => filters.sort,
    () => filters.order,
    () => productPagination.value.total,
  ],
  () => {
    tablePagination.value = {
      ...tablePagination.value,
      page: filters.page ?? 1,
      rowsPerPage: filters.perPage ?? 10,
      rowsNumber: productPagination.value.total,
      sortBy: filters.sort ?? null,
      descending: filters.order === 'desc',
    };
  },
  { immediate: true },
);

const statusOptions = computed<Option[]>(() =>
  (['draft', 'active', 'inactive', 'archived'] as ProductStatus[]).map((value) => ({
    value,
    label: t(`catalog.products.status.${value}`),
  })),
);

const columns = computed<QTableProps['columns']>(() => [
  {
    name: 'sku',
    label: t('catalog.products.table.sku'),
    field: 'sku',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'name',
    label: t('catalog.products.table.name'),
    field: 'name',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'category',
    label: t('catalog.products.table.category'),
    field: (row: Product) => row.category?.name ?? '—',
    align: 'left' as const,
  },
  {
    name: 'brand',
    label: t('catalog.products.table.brand'),
    field: (row: Product) => row.brand?.name ?? '—',
    align: 'left' as const,
  },
  {
    name: 'price',
    label: t('catalog.products.table.price'),
    field: 'price',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'imageUrl',
    label: t('catalog.products.table.imageUrl'),
    field: 'imageUrl',
    align: 'left' as const,
  },
  {
    name: 'status',
    label: t('catalog.products.table.status'),
    field: 'status',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'onHand',
    label: t('catalog.products.table.onHand'),
    field: 'onHand',
    align: 'right' as const,
  },
  {
    name: 'actions',
    label: t('catalog.products.table.actions'),
    field: 'id',
    align: 'right' as const,
  },
]);

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

const mapFiltersToParams = (): ListParams => {
  const trimmedSearch = filters.search?.trim() ?? '';

  return {
    page: filters.page ?? 1,
    perPage: filters.perPage ?? 10,
    search: trimmedSearch.length > 0 ? trimmedSearch : '',
    status: filters.status ?? null,
    categoryId:
      filters.categoryId !== null && filters.categoryId !== undefined ? filters.categoryId : null,
    brandId: filters.brandId !== null && filters.brandId !== undefined ? filters.brandId : null,
    sort: filters.sort ?? null,
    order: filters.order ?? null,
  };
};

async function performLoad() {
  try {
    await fetchProducts(mapFiltersToParams());
    const meta = productPagination.value;
    updateFilters(
      {
        page: meta.page,
        perPage: meta.perPage,
      },
      { syncRoute: false },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : t('catalog.products.notify.loadError');
    notifyError({ message });
  }
}

const onRequest: QTableProps['onRequest'] = ({ pagination }) => {
  if (!pagination) {
    return;
  }
  updateFilters(
    {
      page: pagination.page,
      perPage: pagination.rowsPerPage,
      sort: typeof pagination.sortBy === 'string' ? pagination.sortBy : undefined,
      order: pagination.descending ? 'desc' : 'asc',
    },
    { syncRoute: true },
  );
  void refresh();
};

async function refresh() {
  await performLoad();
}

const handleCreate = () => {
  void router.push({ name: 'catalog-products-create' });
};

const viewProduct = (id: number) => {
  void router.push({ name: 'catalog-products-detail', params: { id } });
};

const editProduct = (id: number) => {
  void router.push({ name: 'catalog-products-edit', params: { id } });
};

const confirmDelete = (product: Product) => {
  Dialog.create({
    title: t('catalog.products.confirm.deleteTitle'),
    message: t('catalog.products.confirm.deleteMessage'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await removeProduct(product.id);
        notifySuccess({ message: t('catalog.products.notify.deleteSuccess') });
        await refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t('catalog.products.notify.loadError');
        notifyError({ message });
      }
    })();
  });
};

const openAdjustDialog = (product: Product) => {
  selectedProduct.value = product;
  adjustDialog.value = true;
};

const openImageDialog = (product: Product) => {
  if (!product.imageUrl) return;
  selectedProduct.value = product;
  // Trim and validate imageUrl - ensure it's not empty after trim
  const imageUrl = product.imageUrl?.trim();
  if (imageUrl && imageUrl.length > 0) {
    selectedImageUrl.value = imageUrl;
  } else {
    selectedImageUrl.value = null;
  }
  selectedDescription.value = product.description ?? '';
  isImageDialogOpen.value = true;
};

const handleAdjustStock = async (payload: StockAdjustPayload) => {
  adjusting.value = true;
  try {
    await adjustStock(payload);
    adjustDialog.value = false;
    notifySuccess({ message: t('catalog.stock.messages.success') });
    await refresh();
  } catch (error) {
    const message = error instanceof Error ? error.message : t('catalog.products.notify.loadError');
    notifyError({ message });
  } finally {
    adjusting.value = false;
  }
};

const loadCategoryOptions = async () => {
  try {
    const { data } = await fetchCategoryList({ perPage: 100 });
    categoryOptions.value = data.map((item) => ({
      value: item.id,
      label: item.name,
    }));
  } catch (error) {
    console.error('[ProductListPage] loadCategoryOptions failed', error);
    notifyError({ message: t('catalog.products.notify.categoryLoadError') });
  }
};

const loadBrandOptions = async () => {
  try {
    const { data } = await fetchBrands({ perPage: 100 });
    brandOptions.value = data.map((item) => ({
      value: item.id,
      label: item.name,
    }));
  } catch (error) {
    console.error('[ProductListPage] loadBrandOptions failed', error);
    notifyError({ message: t('catalog.products.notify.brandLoadError') });
  }
};

onMounted(() => {
  applyFromRoute();
  void loadCategoryOptions();
  void loadBrandOptions();
  void refresh();
});
</script>

<style scoped>
.catalog-card {
  min-height: 480px;
}

.product-thumb {
  width: 64px;
  max-width: 64px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
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

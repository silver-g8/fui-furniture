<template>
  <q-page padding>
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">{{ product?.name ?? t('catalog.products.detailTitle') }}</div>
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
          <q-btn flat color="primary" icon="arrow_back" :label="t('catalog.products.actions.cancel')" @click="goBack" />
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
                  <q-img
                    v-if="product.imageUrl"
                    :src="product.imageUrl"
                    class="product-detail-image"
                    ratio="4/3"
                    :alt="product.name"
                    spinner-color="primary"
                  />
                  <div v-else class="product-detail-placeholder column items-center justify-center">
                    <q-icon name="image_not_supported" size="42px" class="text-grey-5 q-mb-sm" />
                    <span class="text-caption text-grey-6">
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
                      <q-item-label overline>{{ t('catalog.products.fields.category') }}</q-item-label>
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
                      <q-item-label>{{ formatCurrency(product.price) }}</q-item-label>
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
            <div v-if="!product?.stockMovements?.length" class="text-grey-6">
              {{ t('catalog.products.empty.description') }}
            </div>
            <q-table
              v-else
              dense
              flat
              :rows="stockRows"
              :columns="stockColumns"
              row-key="id"
              :rows-per-page-options="[5, 10, 20]"
            >
              <template #body-cell-type="props">
                <q-td :props="props">
                  <q-badge :color="props.value === 'adjust_in' ? 'positive' : 'negative'">
                    {{ t(`catalog.stock.types.${props.value}`) }}
                  </q-badge>
                </q-td>
              </template>
            </q-table>
          </q-tab-panel>

          <q-tab-panel name="activity">
            <q-banner dense rounded class="bg-grey-1 text-grey-7">
              {{ t('catalog.products.tabs.activity') }} — TODO
            </q-banner>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { ProductStatus, StockMovement } from '@/types/catalog';
import { useNotifier } from '@/composables/useNotifier';
import { useLoadingOverlay } from '@/composables/useLoadingOverlay';
import { useProducts } from '@/composables/useProducts';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { current, loading: productsLoading, fetchProduct, resetCurrent } = useProducts();
const { error: notifyError } = useNotifier();
const { withLoading } = useLoadingOverlay();

const tab = ref<'overview' | 'stock' | 'activity'>('overview');
const productId = Number(route.params.id);

const product = computed(() => current.value);

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

const stockRows = computed(() => product.value?.stockMovements ?? []);

const stockColumns = computed(() => [
  {
    name: 'createdAt',
    label: 'Date',
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
    field: 'warehouseId',
  },
  {
    name: 'balanceAfter',
    label: t('catalog.stock.fields.balanceAfter'),
    field: 'balanceAfter',
  },
  {
    name: 'reason',
    label: t('catalog.stock.fields.reason'),
    field: (row: StockMovement) => row.reason ?? '—',
  },
]);

const load = async () => {
  try {
    await withLoading(() => fetchProduct(productId), {
      message: t('catalog.common.loading'),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : t('catalog.products.notify.loadError');
    notifyError({ message });
  }
};

const goToEdit = () => {
  void router.push({ name: 'catalog-products-edit', params: { id: productId } });
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  void load();
});

onBeforeUnmount(() => {
  resetCurrent();
});
</script>

<style scoped>
.product-detail-image {
  border-radius: 8px;
  overflow: hidden;
}

.product-detail-placeholder {
  min-height: 160px;
  border: 1px dashed #d5d5d5;
  border-radius: 8px;
  background-color: #f5f5f5;
}
</style>


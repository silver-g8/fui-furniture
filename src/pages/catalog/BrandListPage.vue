<template>
  <q-page padding>
    <q-card flat bordered class="catalog-card">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5 q-mb-xs">{{ t('catalog.brands.listTitle') }}</div>
          <div class="text-subtitle2 text-grey-7">{{ t('catalog.brands.title') }}</div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn
            color="primary"
            icon="add"
            :label="t('catalog.brands.actions.create')"
            @click="handleCreate"
          />
          <q-btn
            flat
            color="primary"
            icon="refresh"
            :label="t('catalog.brands.actions.refresh')"
            :loading="brandStore.loading"
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
              :label="t('catalog.brands.filters.search')"
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
              v-model="isActiveFilter"
              :label="t('catalog.brands.filters.isActive')"
              :options="isActiveOptions"
              emit-value
              map-options
              clearable
              outlined
              dense
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
        :loading="brandStore.loading"
        :pagination="tablePagination"
        :rows-per-page-options="[10, 20, 50]"
        @request="onRequest"
      >
        <template #body-cell-isActive="props">
          <q-td :props="props">
            <q-badge :color="props.value ? 'positive' : 'grey'">
              {{ props.value ? t('catalog.common.active') : t('catalog.common.inactive') }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              dense
              flat
              icon="edit"
              color="primary"
              :label="t('catalog.brands.actions.edit')"
              @click="editBrand(props.row.id)"
            />
            <q-btn
              dense
              flat
              icon="delete"
              color="negative"
              :label="t('catalog.brands.actions.delete')"
              @click="confirmDelete(props.row)"
            />
          </q-td>
        </template>

        <template #no-data>
          <div class="text-center q-pa-lg column items-center">
            <q-icon name="branding_watermark" size="64px" color="grey-5" />
            <div class="text-subtitle1">{{ t('catalog.brands.empty.title') }}</div>
            <div class="text-body2 text-grey-6">
              {{ t('catalog.brands.empty.description') }}
            </div>
          </div>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Dialog } from 'quasar';
import type { QTableProps } from 'quasar';
import type { Brand, ListParams } from '@/types/catalog';
import { useBrandStore } from '@/stores/catalog/useBrandStore';
import { useTableFilters } from '@/composables/useTableFilters';
import { useNotifier } from '@/composables/useNotifier';

const router = useRouter();
const { t } = useI18n();
const brandStore = useBrandStore();
const { success: notifySuccess, error: notifyError } = useNotifier();

const { filters, updateFilters, applyFromRoute } = useTableFilters({
  defaults: {
    search: '',
    isActive: null as boolean | null,
    page: 1,
    perPage: 10,
    sort: undefined as string | undefined,
    order: undefined as 'asc' | 'desc' | undefined,
  },
  parsers: {
    isActive: (value) => {
      const normalized = Array.isArray(value) ? value[0] : value;
      if (normalized === '1' || normalized === 'true') return true;
      if (normalized === '0' || normalized === 'false') return false;
      return null;
    },
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
    isActive: (value) => {
      if (value === true) return '1';
      if (value === false) return '0';
      return undefined;
    },
    page: (value) => (value && value !== 1 ? String(value) : undefined),
    perPage: (value) => (value && value !== 10 ? String(value) : undefined),
    sort: (value) => (value ? String(value) : undefined),
    order: (value) => (value ? String(value) : undefined),
  },
  onRouteChange: () => {
    void refresh();
  },
});

const rows = computed(() => brandStore.items);

const search = computed({
  get: () => filters.search ?? '',
  set: (value: string) => {
    updateFilters({ search: value, page: 1 });
    void refresh();
  },
});

const isActiveFilter = computed<boolean | null>({
  get: () => (typeof filters.isActive === 'boolean' ? filters.isActive : null),
  set: (value: boolean | null) => {
    updateFilters({ isActive: value, page: 1 });
    void refresh();
  },
});

const tablePagination = computed<QTableProps['pagination']>(() => ({
  page: filters.page ?? 1,
  rowsPerPage: filters.perPage ?? 10,
  rowsNumber: brandStore.pagination.total,
  sortBy: filters.sort ?? null,
  descending: filters.order === 'desc',
}));

const isActiveOptions = computed(() => [
  { label: t('catalog.common.active'), value: true },
  { label: t('catalog.common.inactive'), value: false },
]);

const columns = computed<QTableProps['columns']>(() => [
  {
    name: 'name',
    label: t('catalog.brands.table.name'),
    field: 'name',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'code',
    label: t('catalog.brands.table.code'),
    field: 'code',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'website',
    label: t('catalog.brands.table.websiteUrl'),
    field: (row: Brand) => row.websiteUrl ?? '—',
    align: 'left' as const,
  },
  {
    name: 'isActive',
    label: t('catalog.brands.table.isActive'),
    field: 'isActive',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'actions',
    label: t('catalog.brands.table.actions'),
    field: 'id',
    align: 'right' as const,
  },
]);

const mapFiltersToParams = (): ListParams => {
  const params: ListParams = {
    page: filters.page ?? 1,
    perPage: filters.perPage ?? 10,
  };

  if (filters.search) {
    params.search = filters.search;
  }
  if (typeof filters.isActive === 'boolean') {
    params.isActive = filters.isActive;
  }
  if (filters.sort) {
    params.sort = filters.sort;
  }
  if (filters.order) {
    params.order = filters.order;
  }

  return params;
};

async function performLoad() {
  try {
    await brandStore.load(mapFiltersToParams());
    const meta = brandStore.pagination;
    updateFilters(
      {
        page: meta.page,
        perPage: meta.perPage,
      },
      { syncRoute: false },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : t('catalog.brands.notify.loadError');
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
  void router.push({ name: 'catalog-brands-create' });
};

const editBrand = (id: number) => {
  void router.push({ name: 'catalog-brands-edit', params: { id } });
};

const confirmDelete = (brand: Brand) => {
  Dialog.create({
    title: t('catalog.brands.confirm.deleteTitle'),
    message: t('catalog.brands.confirm.deleteMessage'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await brandStore.remove(brand.id);
        notifySuccess({ message: t('catalog.brands.notify.deleteSuccess') });
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : t('catalog.brands.notify.loadError');
        notifyError({ message });
      }
    })();
  });
};

onMounted(() => {
  applyFromRoute();
  void refresh();
});
</script>

<style scoped>
.catalog-card {
  min-height: 420px;
}
</style>


import { acceptHMRUpdate, defineStore } from 'pinia';
import type { ListParams, Product } from '@/types/catalog';
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  getProduct,
  updateProduct,
} from '@/services/catalog/product.service';
import type { ProductPayload } from '@/types/catalog';

interface ProductState {
  items: Product[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
  filters: ListParams;
  loading: boolean;
  saving: boolean;
  current: Product | null;
  error: string | null;
}

const initialPagination = () => ({
  page: 1,
  perPage: 10,
  total: 0,
  lastPage: 1,
});

const initialFilters = (): ListParams => ({
  page: 1,
  perPage: 10,
  search: '',
});

const initialState = (): ProductState => ({
  items: [],
  pagination: initialPagination(),
  filters: initialFilters(),
  loading: false,
  saving: false,
  current: null,
  error: null,
});

const mergeFilters = (base: ListParams, incoming?: ListParams): ListParams => {
  if (!incoming) {
    return { ...base };
  }
  return {
    ...base,
    ...incoming,
    page: incoming.page ?? base.page ?? 1,
    perPage: incoming.perPage ?? base.perPage ?? 10,
  };
};

export const useProductStore = defineStore('catalog-products', {
  state: initialState,

  getters: {
    hasItems: (state) => state.items.length > 0,
  },

  actions: {
    reset() {
      Object.assign(this, initialState());
    },

    setFilters(filters: ListParams) {
      this.filters = mergeFilters(this.filters, filters);
    },

    setError(message: string | null) {
      this.error = message;
    },

    async load(params?: ListParams) {
      this.loading = true;
      this.error = null;

      const mergedFilters = mergeFilters(this.filters, params);
      this.filters = mergedFilters;

      try {
        const { data, meta } = await fetchProducts(mergedFilters);
        this.items = data;
        this.pagination = {
          page: meta.page,
          perPage: meta.perPage,
          total: meta.total,
          lastPage: meta.lastPage,
        };
      } catch (error) {
        this.items = [];
        this.pagination = initialPagination();
        this.error = error instanceof Error ? error.message : 'Failed to load products';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async loadById(id: number) {
      this.loading = true;
      this.error = null;

      try {
        this.current = await getProduct(id);
      } catch (error) {
        this.current = null;
        this.error = error instanceof Error ? error.message : 'Failed to load product';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    clearCurrent() {
      this.current = null;
    },

    async create(payload: ProductPayload) {
      this.saving = true;
      this.error = null;

      try {
        const product = await createProduct(payload);
        this.items = [product, ...this.items];
        this.pagination.total += 1;
        this.current = product;
        return product;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create product';
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async update(id: number, payload: ProductPayload) {
      this.saving = true;
      this.error = null;

      try {
        const product = await updateProduct(id, payload);
        this.items = this.items.map((item) => (item.id === product.id ? product : item));
        if (this.current && this.current.id === product.id) {
          this.current = product;
        }
        return product;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update product';
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async remove(id: number) {
      this.saving = true;
      this.error = null;

      try {
        await deleteProduct(id);
        this.items = this.items.filter((item) => item.id !== id);
        this.pagination.total = Math.max(0, this.pagination.total - 1);
        if (this.current && this.current.id === id) {
          this.current = null;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete product';
        throw error;
      } finally {
        this.saving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProductStore, import.meta.hot));
}


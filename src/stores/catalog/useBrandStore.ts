import { acceptHMRUpdate, defineStore } from 'pinia';
import type { Brand, ListParams } from '@/types/catalog';
import {
  createBrand,
  deleteBrand,
  fetchBrands,
  getBrand,
  updateBrand,
  type BrandPayload,
} from '@/services/catalog/brand.service';

interface BrandState {
  items: Brand[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
  filters: ListParams;
  loading: boolean;
  saving: boolean;
  current: Brand | null;
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

const initialState = (): BrandState => ({
  items: [],
  pagination: initialPagination(),
  filters: initialFilters(),
  loading: false,
  saving: false,
  current: null,
  error: null,
});

const mergeFilters = (base: ListParams, incoming?: ListParams): ListParams => ({
  ...base,
  ...incoming,
  page: incoming?.page ?? base.page ?? 1,
  perPage: incoming?.perPage ?? base.perPage ?? 10,
});

export const useBrandStore = defineStore('catalog-brands', {
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
        const { data, meta } = await fetchBrands(mergedFilters);
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
        this.error = error instanceof Error ? error.message : 'Failed to load brands';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async loadById(id: number) {
      this.loading = true;
      this.error = null;

      try {
        this.current = await getBrand(id);
      } catch (error) {
        this.current = null;
        this.error = error instanceof Error ? error.message : 'Failed to load brand';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    clearCurrent() {
      this.current = null;
    },

    async create(payload: BrandPayload) {
      this.saving = true;
      this.error = null;

      try {
        const brand = await createBrand(payload);
        this.items = [brand, ...this.items];
        this.pagination.total += 1;
        this.current = brand;
        return brand;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create brand';
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async update(id: number, payload: BrandPayload) {
      this.saving = true;
      this.error = null;

      try {
        const brand = await updateBrand(id, payload);
        this.items = this.items.map((item) => (item.id === brand.id ? brand : item));
        if (this.current && this.current.id === brand.id) {
          this.current = brand;
        }
        return brand;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update brand';
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async remove(id: number) {
      this.saving = true;
      this.error = null;

      try {
        await deleteBrand(id);
        this.items = this.items.filter((item) => item.id !== id);
        this.pagination.total = Math.max(0, this.pagination.total - 1);
        if (this.current && this.current.id === id) {
          this.current = null;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete brand';
        throw error;
      } finally {
        this.saving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBrandStore, import.meta.hot));
}


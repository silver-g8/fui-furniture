import { acceptHMRUpdate, defineStore } from 'pinia';
import type { Quotation, QuotationPayload, QuotationListParams } from '@/types/sales';
import {
  listQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  approveQuotation,
  rejectQuotation,
  createSalesOrderFromQuotation,
} from '@/services/sales/quotation.service';

interface QuotationState {
  items: Quotation[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
  filters: QuotationListParams;
  loading: boolean;
  saving: boolean;
  current: Quotation | null;
  error: string | null;
}

const initialPagination = () => ({
  page: 1,
  perPage: 15,
  total: 0,
  lastPage: 1,
});

const initialFilters = (): QuotationListParams => ({
  page: 1,
  per_page: 15,
});

const initialState = (): QuotationState => ({
  items: [],
  pagination: initialPagination(),
  filters: initialFilters(),
  loading: false,
  saving: false,
  current: null,
  error: null,
});

const mergeFilters = (
  base: QuotationListParams,
  incoming?: QuotationListParams,
): QuotationListParams => {
  if (!incoming) {
    return { ...base };
  }
  return {
    ...base,
    ...incoming,
    page: incoming.page ?? base.page ?? 1,
    per_page: incoming.per_page ?? base.per_page ?? 15,
  };
};

export const useQuotationStore = defineStore('sales-quotations', {
  state: initialState,

  getters: {
    hasItems: (state) => state.items.length > 0,
  },

  actions: {
    reset() {
      Object.assign(this, initialState());
    },

    setFilters(filters: QuotationListParams) {
      this.filters = mergeFilters(this.filters, filters);
    },

    setError(message: string | null) {
      this.error = message;
    },

    async load(params?: QuotationListParams) {
      this.loading = true;
      this.error = null;

      const mergedFilters = mergeFilters(this.filters, params);
      this.filters = mergedFilters;

      try {
        const response = await listQuotations(mergedFilters);
        this.items = response.data || [];
        this.pagination = {
          page: response.meta?.current_page || 1,
          perPage: response.meta?.per_page || 15,
          total: response.meta?.total || 0,
          lastPage: Math.ceil((response.meta?.total || 0) / (response.meta?.per_page || 15)),
        };
      } catch (error) {
        this.items = [];
        this.pagination = initialPagination();
        // ไม่แสดง error ถ้าเป็น 403 (Forbidden) - เป็น permission issue
        const errorStatus = error instanceof Error && 'status' in error ? (error as { status?: number }).status : undefined;
        if (errorStatus !== 403) {
          this.error = error instanceof Error ? error.message : 'Failed to load quotations';
        } else {
          this.error = null; // ไม่แสดง error สำหรับ 403
        }
        // ไม่ throw error ถ้าเป็น 403 เพื่อไม่ให้แสดงใน console
        if (errorStatus !== 403) {
          throw error;
        }
      } finally {
        this.loading = false;
      }
    },

    async loadById(id: number) {
      this.loading = true;
      this.error = null;

      try {
        this.current = await getQuotation(id);
      } catch (error) {
        this.current = null;
        this.error = error instanceof Error ? error.message : 'Failed to load quotation';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    clearCurrent() {
      this.current = null;
    },

    async create(payload: QuotationPayload) {
      this.saving = true;
      this.error = null;

      try {
        const quotation = await createQuotation(payload);
        this.items = [quotation, ...this.items];
        this.pagination.total += 1;
        this.current = quotation;
        return quotation;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create quotation';
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async update(id: number, payload: Partial<QuotationPayload>) {
      this.saving = true;
      this.error = null;

      try {
        const quotation = await updateQuotation(id, payload);
        this.items = this.items.map((item) => (item.id === quotation.id ? quotation : item));
        if (this.current && this.current.id === quotation.id) {
          this.current = quotation;
        }
        return quotation;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update quotation';
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async remove(id: number) {
      this.saving = true;
      this.error = null;

      try {
        await deleteQuotation(id);
        this.items = this.items.filter((item) => item.id !== id);
        this.pagination.total = Math.max(0, this.pagination.total - 1);
        if (this.current && this.current.id === id) {
          this.current = null;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete quotation';
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async approve(id: number) {
      this.saving = true;
      this.error = null;

      try {
        const quotation = await approveQuotation(id);
        this.items = this.items.map((item) => (item.id === quotation.id ? quotation : item));
        if (this.current && this.current.id === quotation.id) {
          this.current = quotation;
        }
        return quotation;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to approve quotation';
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async reject(id: number, reason: string) {
      this.saving = true;
      this.error = null;

      try {
        const quotation = await rejectQuotation(id, reason);
        this.items = this.items.map((item) => (item.id === quotation.id ? quotation : item));
        if (this.current && this.current.id === quotation.id) {
          this.current = quotation;
        }
        return quotation;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to reject quotation';
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async createSalesOrder(id: number) {
      this.saving = true;
      this.error = null;

      try {
        const salesOrder = await createSalesOrderFromQuotation(id);
        return salesOrder;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create sales order';
        throw error;
      } finally {
        this.saving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useQuotationStore, import.meta.hot));
}


import { acceptHMRUpdate, defineStore } from 'pinia';
import type {
  SalesOrder,
  SalesOrderPayload,
  SalesOrderListParams,
} from '@/types/sales';
import {
  listSalesOrders,
  getSalesOrder,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  confirmSalesOrder,
  reserveSalesOrder,
  deliverSalesOrder,
  cancelSalesOrder,
} from '@/services/sales/salesOrder.service';

interface SalesOrderState {
  items: SalesOrder[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
  filters: SalesOrderListParams;
  loading: boolean;
  saving: boolean;
  current: SalesOrder | null;
  error: string | null;
}

const initialPagination = () => ({
  page: 1,
  perPage: 15,
  total: 0,
  lastPage: 1,
});

const initialFilters = (): SalesOrderListParams => ({
  page: 1,
  per_page: 15,
});

const initialState = (): SalesOrderState => ({
  items: [],
  pagination: initialPagination(),
  filters: initialFilters(),
  loading: false,
  saving: false,
  current: null,
  error: null,
});

const mergeFilters = (
  base: SalesOrderListParams,
  incoming?: SalesOrderListParams,
): SalesOrderListParams => {
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

export const useSalesOrderStore = defineStore('sales-orders', {
  state: initialState,

  getters: {
    hasItems: (state) => state.items.length > 0,
  },

  actions: {
    reset() {
      Object.assign(this, initialState());
    },

    setFilters(filters: SalesOrderListParams) {
      this.filters = mergeFilters(this.filters, filters);
    },

    setError(message: string | null) {
      this.error = message;
    },

    async load(params?: SalesOrderListParams) {
      this.loading = true;
      this.error = null;

      const mergedFilters = mergeFilters(this.filters, params);
      this.filters = mergedFilters;

      try {
        const response = await listSalesOrders(mergedFilters);
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
          this.error = error instanceof Error ? error.message : 'Failed to load sales orders';
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
        this.current = await getSalesOrder(id);
      } catch (error) {
        this.current = null;
        this.error = error instanceof Error ? error.message : 'Failed to load sales order';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    clearCurrent() {
      this.current = null;
    },

    async create(payload: SalesOrderPayload) {
      this.saving = true;
      this.error = null;

      try {
        const salesOrder = await createSalesOrder(payload);
        this.items = [salesOrder, ...this.items];
        this.pagination.total += 1;
        this.current = salesOrder;
        return salesOrder;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create sales order';
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async update(id: number, payload: Partial<SalesOrderPayload>) {
      this.saving = true;
      this.error = null;

      try {
        const salesOrder = await updateSalesOrder(id, payload);
        this.items = this.items.map((item) =>
          item.id === salesOrder.id ? salesOrder : item,
        );
        if (this.current && this.current.id === salesOrder.id) {
          this.current = salesOrder;
        }
        return salesOrder;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update sales order';
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async remove(id: number) {
      this.saving = true;
      this.error = null;

      try {
        await deleteSalesOrder(id);
        this.items = this.items.filter((item) => item.id !== id);
        this.pagination.total = Math.max(0, this.pagination.total - 1);
        if (this.current && this.current.id === id) {
          this.current = null;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete sales order';
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async confirm(id: number) {
      this.saving = true;
      this.error = null;

      try {
        const salesOrder = await confirmSalesOrder(id);
        this.items = this.items.map((item) =>
          item.id === salesOrder.id ? salesOrder : item,
        );
        if (this.current && this.current.id === salesOrder.id) {
          this.current = salesOrder;
        }
        return salesOrder;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to confirm sales order';
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async reserve(id: number) {
      this.saving = true;
      this.error = null;

      try {
        const salesOrder = await reserveSalesOrder(id);
        this.items = this.items.map((item) =>
          item.id === salesOrder.id ? salesOrder : item,
        );
        if (this.current && this.current.id === salesOrder.id) {
          this.current = salesOrder;
        }
        return salesOrder;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to reserve sales order';
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async deliver(id: number) {
      this.saving = true;
      this.error = null;

      try {
        const salesOrder = await deliverSalesOrder(id);
        this.items = this.items.map((item) =>
          item.id === salesOrder.id ? salesOrder : item,
        );
        if (this.current && this.current.id === salesOrder.id) {
          this.current = salesOrder;
        }
        return salesOrder;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to deliver sales order';
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async cancel(id: number) {
      this.saving = true;
      this.error = null;

      try {
        const salesOrder = await cancelSalesOrder(id);
        this.items = this.items.map((item) =>
          item.id === salesOrder.id ? salesOrder : item,
        );
        if (this.current && this.current.id === salesOrder.id) {
          this.current = salesOrder;
        }
        return salesOrder;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to cancel sales order';
        throw error;
      } finally {
        this.saving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSalesOrderStore, import.meta.hot));
}


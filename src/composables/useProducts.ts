import { ref } from 'vue';
import type {
  ListParams,
  PaginationMeta,
  Product,
  ProductPayload,
} from '@/types/catalog';
import {
  fetchProducts as fetchProductList,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/services/catalog/product.service';

const initialPagination = (): PaginationMeta => ({
  page: 1,
  perPage: 10,
  total: 0,
  lastPage: 1,
});

export function useProducts() {
  const items = ref<Product[]>([]);
  const current = ref<Product | null>(null);
  const pagination = ref<PaginationMeta>(initialPagination());
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);

  const setError = (err: unknown) => {
    error.value = err instanceof Error ? err.message : 'Unexpected error';
  };

  const fetchProducts = async (params?: ListParams) => {
    loading.value = true;
    error.value = null;

    try {
      const { data, meta } = await fetchProductList(params);
      items.value = data;
      pagination.value = meta;
      return data;
    } catch (err) {
      items.value = [];
      pagination.value = initialPagination();
      setError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchProduct = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const product = await getProduct(id);
      current.value = product;
      return product;
    } catch (err) {
      current.value = null;
      setError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const create = async (payload: ProductPayload) => {
    saving.value = true;
    error.value = null;

    try {
      const product = await createProduct(payload);
      items.value = [product, ...items.value];
      pagination.value = {
        ...pagination.value,
        total: pagination.value.total + 1,
      };
      current.value = product;
      return product;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      saving.value = false;
    }
  };

  const update = async (id: number, payload: ProductPayload) => {
    saving.value = true;
    error.value = null;

    try {
      const product = await updateProduct(id, payload);
      items.value = items.value.map((item) => (item.id === product.id ? product : item));
      if (current.value?.id === product.id) {
        current.value = product;
      }
      return product;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      saving.value = false;
    }
  };

  const remove = async (id: number) => {
    saving.value = true;
    error.value = null;

    try {
      await deleteProduct(id);
      items.value = items.value.filter((item) => item.id !== id);
      pagination.value = {
        ...pagination.value,
        total: Math.max(0, pagination.value.total - 1),
      };
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      saving.value = false;
    }
  };

  const resetCurrent = () => {
    current.value = null;
    error.value = null;
  };

  return {
    items,
    current,
    pagination,
    loading,
    saving,
    error,
    fetchProducts,
    fetchProduct,
    create,
    update,
    remove,
    resetCurrent,
  };
}


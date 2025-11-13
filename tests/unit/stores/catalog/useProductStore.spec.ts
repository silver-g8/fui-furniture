import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useProductStore } from '@/stores/catalog/useProductStore';
import type { Product, ProductPayload, ProductStatus } from '@/types/catalog';

const mockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  sku: 'SKU-001',
  name: 'Demo Product',
  description: 'Sample',
  status: 'active',
  price: 1000,
  cost: 500,
  brandId: null,
  categoryId: null,
  onHand: 25,
  imageUrl: null,
  brand: null,
  category: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  stockMovements: [],
  ...overrides,
});

const fetchProducts = vi.fn();
const getProduct = vi.fn();
const createProduct = vi.fn();
const updateProduct = vi.fn();
const deleteProduct = vi.fn();

vi.mock('@/services/catalog/product.service', () => ({
  fetchProducts: (...args: unknown[]) => fetchProducts(...args),
  getProduct: (...args: unknown[]) => getProduct(...args),
  createProduct: (...args: unknown[]) => createProduct(...args),
  updateProduct: (...args: unknown[]) => updateProduct(...args),
  deleteProduct: (...args: unknown[]) => deleteProduct(...args),
}));

const mockListResponse = (products: Product[], total = products.length) => ({
  data: products,
  meta: {
    page: 1,
    perPage: 10,
    total,
    lastPage: 1,
  },
});

describe('useProductStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    fetchProducts.mockReset();
    getProduct.mockReset();
    createProduct.mockReset();
    updateProduct.mockReset();
    deleteProduct.mockReset();
  });

  it('โหลดข้อมูลสินค้าและอัปเดตสถานะ', async () => {
    const store = useProductStore();
    fetchProducts.mockResolvedValueOnce(mockListResponse([mockProduct()]));

    await store.load();

    expect(fetchProducts).toHaveBeenCalledTimes(1);
    expect(store.items).toHaveLength(1);
    expect(store.pagination.total).toBe(1);
    expect(store.error).toBeNull();
  });

  it('ตั้งค่า error เมื่อโหลดข้อมูลล้มเหลว', async () => {
    const store = useProductStore();
    fetchProducts.mockRejectedValueOnce(new Error('network error'));

    await expect(store.load()).rejects.toThrow('network error');
    expect(store.items).toHaveLength(0);
    expect(store.error).toBe('network error');
  });

  it('สร้างสินค้าใหม่และเพิ่มเข้า state', async () => {
    const store = useProductStore();
    const payload: ProductPayload = {
      sku: 'SKU-NEW',
      name: 'New Product',
      description: null,
      status: 'draft',
      price: 500,
      cost: null,
      brandId: null,
      categoryId: null,
      onHand: 0,
      imageUrl: null,
    };

    createProduct.mockResolvedValueOnce(mockProduct({ id: 2, sku: payload.sku, status: payload.status }));

    await store.create(payload);

    expect(createProduct).toHaveBeenCalledWith(payload);
    expect(store.items[0]?.sku).toBe('SKU-NEW');
    expect(store.pagination.total).toBe(1);
  });

  it('อัปเดตสินค้าและสะท้อนผลใน state', async () => {
    const store = useProductStore();
    const existing = mockProduct();
    store.items = [existing];
    store.pagination.total = 1;

    updateProduct.mockResolvedValueOnce(
      mockProduct({ id: existing.id, name: 'Updated', status: 'inactive' as ProductStatus }),
    );

    await store.update(existing.id, {
      sku: existing.sku,
      name: 'Updated',
      description: existing.description ?? null,
      status: 'inactive',
      price: existing.price,
      cost: existing.cost ?? null,
      brandId: existing.brandId ?? null,
      categoryId: existing.categoryId ?? null,
      onHand: existing.onHand,
      imageUrl: existing.imageUrl ?? null,
    });

    expect(store.items[0]?.name).toBe('Updated');
    expect(store.items[0]?.status).toBe('inactive');
  });

  it('ลบสินค้าจาก state หลังลบสำเร็จ', async () => {
    const store = useProductStore();
    const existing = mockProduct();
    store.items = [existing];
    store.pagination.total = 1;
    deleteProduct.mockResolvedValueOnce(undefined);

    await store.remove(existing.id);

    expect(deleteProduct).toHaveBeenCalledWith(existing.id);
    expect(store.items).toHaveLength(0);
    expect(store.pagination.total).toBe(0);
  });
});


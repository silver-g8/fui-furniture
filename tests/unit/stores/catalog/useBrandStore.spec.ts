import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useBrandStore } from '@/stores/catalog/useBrandStore';
import type { Brand } from '@/types/catalog';
import type { BrandPayload } from '@/services/catalog/brand.service';

const mockBrand = (overrides: Partial<Brand> = {}): Brand => ({
  id: 1,
  name: 'Demo Brand',
  slug: 'demo-brand',
  code: 'BR001',
  websiteUrl: 'https://example.com',
  logoUrl: null,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const fetchBrands = vi.fn();
const getBrand = vi.fn();
const createBrand = vi.fn();
const updateBrand = vi.fn();
const deleteBrand = vi.fn();

vi.mock('@/services/catalog/brand.service', () => ({
  fetchBrands: (...args: unknown[]) => fetchBrands(...args),
  getBrand: (...args: unknown[]) => getBrand(...args),
  createBrand: (...args: unknown[]) => createBrand(...args),
  updateBrand: (...args: unknown[]) => updateBrand(...args),
  deleteBrand: (...args: unknown[]) => deleteBrand(...args),
}));

const mockListResponse = (brands: Brand[], total = brands.length) => ({
  data: brands,
  meta: {
    page: 1,
    perPage: 10,
    total,
    lastPage: 1,
  },
});

describe('useBrandStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    fetchBrands.mockReset();
    getBrand.mockReset();
    createBrand.mockReset();
    updateBrand.mockReset();
    deleteBrand.mockReset();
  });

  it('โหลดแบรนด์และตั้งค่า state', async () => {
    const store = useBrandStore();
    fetchBrands.mockResolvedValueOnce(mockListResponse([mockBrand()]));

    await store.load();

    expect(fetchBrands).toHaveBeenCalled();
    expect(store.items).toHaveLength(1);
    expect(store.pagination.total).toBe(1);
  });

  it('ตั้งค่า error เมื่อโหลดแบรนด์ล้มเหลว', async () => {
    const store = useBrandStore();
    fetchBrands.mockRejectedValueOnce(new Error('failed'));

    await expect(store.load()).rejects.toThrow('failed');
    expect(store.error).toBe('failed');
    expect(store.items).toHaveLength(0);
  });

  it('สร้างแบรนด์ใหม่', async () => {
    const store = useBrandStore();
    const payload: BrandPayload = {
      name: 'New Brand',
      slug: 'new-brand',
      code: 'NB001',
      websiteUrl: null,
      logoUrl: null,
      isActive: true,
    };

    createBrand.mockResolvedValueOnce(mockBrand({ id: 2, name: payload.name }));

    await store.create(payload);

    expect(createBrand).toHaveBeenCalledWith(payload);
    expect(store.items[0]?.name).toBe('New Brand');
    expect(store.pagination.total).toBe(1);
  });

  it('อัปเดตแบรนด์ที่มีอยู่', async () => {
    const store = useBrandStore();
    const existing = mockBrand();
    store.items = [existing];
    store.pagination.total = 1;

    updateBrand.mockResolvedValueOnce(mockBrand({ id: existing.id, name: 'Updated Brand' }));

    await store.update(existing.id, {
      name: 'Updated Brand',
      slug: existing.slug,
      code: existing.code,
      websiteUrl: existing.websiteUrl ?? null,
      logoUrl: existing.logoUrl ?? null,
      isActive: existing.isActive,
    });

    expect(store.items[0]?.name).toBe('Updated Brand');
  });

  it('ลบแบรนด์ออกจาก state', async () => {
    const store = useBrandStore();
    const existing = mockBrand();
    store.items = [existing];
    store.pagination.total = 1;

    deleteBrand.mockResolvedValueOnce(undefined);
    await store.remove(existing.id);

    expect(deleteBrand).toHaveBeenCalledWith(existing.id);
    expect(store.items).toHaveLength(0);
    expect(store.pagination.total).toBe(0);
  });
});


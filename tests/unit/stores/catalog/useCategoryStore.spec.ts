import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCategoryStore } from '@/stores/catalog/useCategoryStore';
import type { CategoryNode } from '@/types/catalog';

const fetchCategoryTree = vi.fn();

vi.mock('@/services/catalog/category.service', () => ({
  fetchCategoryTree: (...args: unknown[]) => fetchCategoryTree(...args),
}));

const mockCategory = (overrides: Partial<CategoryNode> = {}): CategoryNode => ({
  id: 1,
  name: 'Root category',
  slug: 'root-category',
  parentId: null,
  isActive: true,
  depth: 0,
  children: [],
  ...overrides,
});

describe('useCategoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    fetchCategoryTree.mockReset();
  });

  it('โหลด tree และเลือก node แรกเป็นค่าเริ่มต้น', async () => {
    const store = useCategoryStore();
    fetchCategoryTree.mockResolvedValueOnce([
      mockCategory({ id: 1, name: 'Furniture' }),
      mockCategory({ id: 2, name: 'Decor' }),
    ]);

    await store.loadTree();

    expect(store.tree).toHaveLength(2);
    expect(store.selected?.name).toBe('Furniture');
    expect(store.error).toBeNull();
  });

  it('ตั้งค่า error เมื่อโหลด tree ล้มเหลว', async () => {
    const store = useCategoryStore();
    fetchCategoryTree.mockRejectedValueOnce(new Error('failed'));

    await expect(store.loadTree()).rejects.toThrow('failed');
    expect(store.tree).toHaveLength(0);
    expect(store.error).toBe('failed');
  });

  it('setSelected สามารถเปลี่ยน node ปัจจุบันได้', () => {
    const store = useCategoryStore();
    const node = mockCategory({ id: 99, name: 'Selected' });
    store.tree = [node];

    store.setSelected(node);

    expect(store.selected?.id).toBe(99);
  });
});


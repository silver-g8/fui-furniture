import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useMenuStore } from '@/stores/menu-store';
import { menuStructure } from '@/config/menu';

describe('menu-store', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('ให้ค่าเริ่มต้นของ state ถูกต้อง', () => {
    const store = useMenuStore();

    expect(store.leftDrawerOpen).toBe(false);
    expect(store.expandedCategories).toEqual(menuStructure.map((category) => category.id));
    expect(store.expandedItems).toEqual([]);
    expect(store.activeMenuItem).toBeNull();
    expect(store.menuStructure).toHaveLength(menuStructure.length);
  });

  it('toggleDrawer และ setDrawer ทำงานถูกต้อง', () => {
    const store = useMenuStore();

    store.toggleDrawer();
    expect(store.leftDrawerOpen).toBe(true);

    store.setDrawer(false);
    expect(store.leftDrawerOpen).toBe(false);
  });

  it('toggleCategory เพิ่มและลบหมวดจาก expandedCategories', () => {
    const store = useMenuStore();
    const firstCategory = menuStructure[0];
    if (!firstCategory) {
      throw new Error('menuStructure fixture is expected to have at least one category');
    }
    const categoryId = firstCategory.id;

    store.collapseCategory(categoryId);

    store.toggleCategory(categoryId);
    expect(store.expandedCategories).toContain(categoryId);

    store.toggleCategory(categoryId);
    expect(store.expandedCategories).not.toContain(categoryId);
  });

  it('setActiveMenuItem กำหนดสถานะเมนูปัจจุบัน', () => {
    const store = useMenuStore();

    store.setActiveMenuItem('/dashboard');
    expect(store.activeMenuItem).toBe('/dashboard');

    store.setActiveMenuItem(null);
    expect(store.activeMenuItem).toBeNull();
  });

  it('expandItem และ collapseItem จัดการ expandedItems ถูกต้อง', () => {
    const store = useMenuStore();
    const mainCategory = menuStructure[0];
    if (!mainCategory) {
      throw new Error('menuStructure fixture is expected to have at least one category');
    }
    const productsItem = mainCategory.items.find((item) => item.id === 'main-products');
    if (!productsItem) {
      throw new Error('main category is expected to contain the main-products item');
    }
    const itemId = productsItem.id;

    store.expandItem(itemId);
    expect(store.expandedItems).toContain(itemId);

    store.collapseItem(itemId);
    expect(store.expandedItems).not.toContain(itemId);
  });

  it('setActiveMenuItem จะขยายหมวดและเมนูที่เกี่ยวข้อง', () => {
    const store = useMenuStore();

    store.setActiveMenuItem('/inventory/products');

    expect(store.activeMenuItem).toBe('/inventory/products');
    expect(store.expandedCategories).toContain('main');
    expect(store.expandedItems).not.toContain('main-products');
  });

  it('reset คืนค่า state กลับสู่ค่าเริ่มต้น', () => {
    const store = useMenuStore();
    const firstCategory = menuStructure[0];
    if (!firstCategory) {
      throw new Error('menuStructure fixture is expected to have at least one category');
    }
    const categoryId = firstCategory.id;

    store.setDrawer(true);
    store.toggleCategory(categoryId);
    const firstItem = firstCategory.items[0];
    if (!firstItem) {
      throw new Error('expected first category to contain at least one item');
    }
    store.expandItem(firstItem.id);
    store.setActiveMenuItem('/dashboard');

    store.reset();

    expect(store.leftDrawerOpen).toBe(false);
    expect(store.expandedCategories).toEqual(menuStructure.map((category) => category.id));
    expect(store.expandedItems).toEqual([]);
    expect(store.activeMenuItem).toBeNull();
  });

  it('บันทึกสถานะลง localStorage เมื่อมีการเปลี่ยน state', () => {
    const store = useMenuStore();
    store.setActiveMenuItem('/inventory/categories');
    const persisted = JSON.parse(localStorage.getItem('fui-menu-state') ?? '{}');

    expect(persisted.activeMenuItem).toBe('/inventory/categories');
    expect(persisted.expandedCategories).toContain('main');
    expect(persisted.expandedItems).not.toContain('main-categories');
  });
});

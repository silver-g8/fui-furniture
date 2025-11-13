import { describe, expect, it } from 'vitest';
import { useMenu } from '@/composables/useMenu';
import { menuStructure } from '@/config/menu';

describe('useMenu composable', () => {
  const { findCategoryById, findItemById, findItemByRoute, getBreadcrumbs, getAllRoutes } =
    useMenu(menuStructure);

  it('ค้นหาเมนูทั้งระดับหมวดหมู่และเมนูย่อยด้วย id ได้', () => {
    const category = findCategoryById('inventory');
    expect(category?.label).toBe('menu.categories.inventory');

    const subItem = findItemById('inventory-products');
    expect(subItem?.route).toBe('/inventory/products');
  });

  it('ค้นหาเมนูด้วย route ได้', () => {
    const routeItem = findItemByRoute('/purchases/orders');
    expect(routeItem?.id).toBe('purchases-orders');
  });

  it('สร้าง breadcrumb ตาม route', () => {
    const breadcrumbs = getBreadcrumbs('/inventory/categories');
    expect(breadcrumbs.map((crumb) => crumb.id)).toEqual(['inventory', 'inventory-categories']);
  });

  it('ส่งคืนรายชื่อ route ทั้งหมดที่มี', () => {
    const routes = getAllRoutes();
    expect(routes).toContain('/inventory/categories');
    expect(routes).toContain('/help/changelog');
  });
});


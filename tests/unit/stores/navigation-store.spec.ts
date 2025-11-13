import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useNavigationStore } from '@/stores/navigation-store';

const STORAGE_KEY = 'fui-navigation-state';

describe('navigation-store persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('บันทึกค่าปัจจุบันลง localStorage เมื่อเปลี่ยน route', () => {
    const store = useNavigationStore();

    store.setCurrentRoute('/inventory/products', { id: '123' }, { sort: 'new' });

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');

    expect(persisted.currentRoute).toBe('/inventory/products');
    expect(persisted.previousRoute).toBe('/');
    expect(persisted.routeParams).toEqual({ id: '123' });
    expect(persisted.queryParams).toEqual({ sort: 'new' });
  });

  it('โหลดค่าจาก localStorage เมื่อสร้าง store ใหม่', () => {
    const payload = {
      currentRoute: '/dashboard',
      previousRoute: '/inventory/products',
      routeParams: { id: 'abc' },
      queryParams: { filter: 'low-stock' },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

    const store = useNavigationStore();

    expect(store.currentRoute).toBe(payload.currentRoute);
    expect(store.previousRoute).toBe(payload.previousRoute);
    expect(store.routeParams).toEqual(payload.routeParams);
    expect(store.queryParams).toEqual(payload.queryParams);
  });

  it('รีเซ็ตสถานะและล้างค่าที่บันทึกไว้', () => {
    const store = useNavigationStore();

    store.setCurrentRoute('/reports/sales', {}, { range: 'monthly' });
    store.reset();

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');

    expect(store.currentRoute).toBe('/');
    expect(store.previousRoute).toBeNull();
    expect(store.routeParams).toEqual({});
    expect(store.queryParams).toEqual({});
    expect(persisted.currentRoute).toBe('/');
    expect(persisted.previousRoute).toBeNull();
  });
});



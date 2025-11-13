import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import MainLayout from '@/layouts/MainLayout.vue';
import routes from '@/router/routes';
import { useMenuStore } from '@/stores/menu-store';

vi.mock('@/services/dashboard-service', () => ({
  getDashboardData: vi.fn().mockResolvedValue({
    widgets: [],
    lastUpdated: new Date().toISOString(),
  }),
}));

describe('menu navigation', () => {
  let router: ReturnType<typeof createRouter>;

  beforeEach(async () => {
    localStorage.clear();
    setActivePinia(createPinia());
    router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    await router.push('/');
    await router.isReady();
  });

  it('แสดงเมนูสินค้าภายใต้หมวดหลักและนำทางไปยังหน้ารายการสินค้า', async () => {
    const wrapper = mount(MainLayout, {
      global: {
        plugins: [router],
      },
    });

    const productsItem = wrapper.find('[data-menu-id="main-products"]');
    expect(productsItem.exists()).toBe(true);

    const pushSpy = vi.spyOn(router, 'push');
    await productsItem.trigger('click');
    const navPromise = pushSpy.mock.results.at(-1)?.value;
    if (navPromise && typeof navPromise.then === 'function') {
      await navPromise;
    }
    await flushPromises();

    expect(pushSpy).toHaveBeenCalledWith('/inventory/products');

    const menuStore = useMenuStore();
    expect(menuStore.activeMenuItem).toBe('/inventory/products');
    expect(menuStore.expandedCategories).toContain('main');
  });

  it('บันทึกสถานะเมนูหลังนำทางไปยังหน้ารายการแบรนด์', async () => {
    const wrapper = mount(MainLayout, {
      global: {
        plugins: [router],
      },
    });

    const brandsItem = wrapper.find('[data-menu-id="main-brands"]');
    expect(brandsItem.exists()).toBe(true);

    const pushSpy = vi.spyOn(router, 'push');
    await brandsItem.trigger('click');
    const navPromise = pushSpy.mock.results.at(-1)?.value;
    if (navPromise && typeof navPromise.then === 'function') {
      await navPromise;
    }
    await flushPromises();

    expect(pushSpy).toHaveBeenCalledWith('/inventory/brands');

    const menuStore = useMenuStore();
    expect(menuStore.activeMenuItem).toBe('/inventory/brands');
    expect(menuStore.expandedCategories).toContain('main');

    const persisted = JSON.parse(localStorage.getItem('fui-menu-state') ?? '{}');
    expect(persisted.activeMenuItem).toBe('/inventory/brands');
    expect(persisted.expandedCategories).toContain('main');
  });
});

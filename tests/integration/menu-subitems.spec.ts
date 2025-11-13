import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { createMemoryHistory, createRouter } from 'vue-router';
import MainLayout from '@/layouts/MainLayout.vue';
import routes from '@/router/routes';
import { useMenuStore } from '@/stores/menu-store';
import { getDashboardData } from '@/services/dashboard-service';

vi.mock('@/services/dashboard-service', () => ({
  getDashboardData: vi.fn().mockResolvedValue({
    widgets: [],
    lastUpdated: new Date().toISOString(),
  }),
}));

vi.mock('@/services/catalog/product.service', () => ({
  fetchProducts: vi.fn().mockResolvedValue({
    data: [],
    meta: {
      page: 1,
      perPage: 10,
      total: 0,
      lastPage: 1,
    },
  }),
  getProduct: vi.fn().mockResolvedValue(null),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));

vi.mock('@/services/catalog/stock.service', () => ({
  adjustStock: vi.fn().mockResolvedValue({
    movementId: 1,
    balanceAfter: 10,
  }),
}));

const mockedGetDashboardData = vi.mocked(getDashboardData);

describe('menu subitems navigation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockedGetDashboardData.mockClear();
    localStorage.clear();
  });

  it('นำทางไปยังเมนูย่อยและอัปเดตสถานะ store', async () => {
    const pinia = createTestingPinia({ stubActions: false });
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    await router.push('/dashboard');
    await router.isReady();

    const wrapper = mount(MainLayout, {
      global: {
        plugins: [pinia, router],
      },
    });

    const menuStore = useMenuStore();
    menuStore.expandCategory('main');

    await flushPromises();

    const menuItem = wrapper.find('[data-menu-id="main-products"]');
    expect(menuItem.exists()).toBe(true);

    const pushSpy = vi.spyOn(router, 'push');

    await menuItem.trigger('click');
    await flushPromises();
    const navPromise = pushSpy.mock.results.at(-1)?.value;
    if (navPromise && typeof navPromise.then === 'function') {
      await navPromise;
    }
    await flushPromises();

    expect(pushSpy).toHaveBeenCalledWith('/inventory/products');
    expect(menuStore.activeMenuItem).toBe('/inventory/products');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/inventory/products');
    expect(menuStore.expandedCategories).toContain('main');

    expect(wrapper.text()).toContain('Product list');
  });
});

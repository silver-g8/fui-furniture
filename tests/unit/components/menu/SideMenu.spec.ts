import { describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { createMemoryHistory, createRouter } from 'vue-router';
import SideMenu from '@/components/menu/SideMenu.vue';
import { useMenuStore } from '@/stores/menu-store';
import type { MenuStructure } from '@/types/menu';

const buildMenuStructure = (): MenuStructure => [
  {
    id: 'main',
    label: 'menu.categories.main',
    icon: 'home',
    order: 1,
    items: [
      {
        id: 'main-dashboard',
        label: 'menu.items.dashboard',
        route: '/dashboard',
        icon: 'dashboard',
        order: 1,
      },
    ],
  },
  {
    id: 'inventory',
    label: 'menu.categories.inventory',
    icon: 'inventory_2',
    order: 2,
    items: [
      {
        id: 'inventory-products',
        label: 'menu.items.products',
        route: '/products',
        order: 1,
      },
    ],
  },
];

const mountSideMenu = async (menu: MenuStructure = buildMenuStructure()) => {
  const pinia = createTestingPinia({ stubActions: false, createSpy: vi.fn });
  const store = useMenuStore(pinia);
  store.setMenuStructure(menu);

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/dashboard', component: { template: '<div />' } },
      { path: '/products', component: { template: '<div />' } },
    ],
  });

  router.push('/');
  await router.isReady();

  const wrapper = mount(SideMenu, {
    global: {
      plugins: [pinia, router],
    },
  });

  await flushPromises();

  return { wrapper, store, router };
};

describe('SideMenu.vue', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('แสดงหมวดหมู่เมนูตาม menu store', async () => {
    const { wrapper } = await mountSideMenu();
    const categories = wrapper.findAll('[data-testid="menu-category"]');
    expect(categories).toHaveLength(2);
  });

  it('คลิกหมวดหมู่แล้วสถานะ expanded ถูกอัปเดต', async () => {
    const { wrapper, store } = await mountSideMenu();
    const firstCategory = wrapper.find('[data-testid="menu-category"][data-category-id="main"]');
    await firstCategory.trigger('click');

    expect(store.expandedCategories).toContain('main');
  });

  it('คลิกรายการเมนูแล้ว activeMenuItem เปลี่ยนค่า', async () => {
    const { wrapper, store } = await mountSideMenu();

    const menuItem = wrapper.find('[data-testid="menu-item"][data-menu-id="main-dashboard"]');
    await menuItem.trigger('click');

    expect(store.activeMenuItem).toBe('/dashboard');
  });
});


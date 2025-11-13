import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { createMemoryHistory, createRouter } from 'vue-router';
import MenuItem from '@/components/menu/MenuItem.vue';
import SideMenu from '@/components/menu/SideMenu.vue';
import { useMenuStore } from '@/stores/menu-store';
import type { MenuItem as MenuItemType, MenuStructure } from '@/types/menu';

const createTestRouter = async (routes: { path: string }[]) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: routes.map((route) => ({
      path: route.path,
      component: { template: '<div />' },
    })),
  });

  router.push('/');
  await router.isReady();

  return router;
};

describe('MultiLevelMenu', () => {
  const createMenuItem = (overrides: Partial<MenuItemType> = {}): MenuItemType => ({
    id: 'parent',
    label: 'menu.items.products',
    route: '/inventory/products',
    icon: 'inventory',
    order: 1,
    items: [
      {
        id: 'child-1',
        label: 'menu.items.productCategories',
        route: '/inventory/categories',
        order: 1,
        items: [
          {
            id: 'child-1-1',
            label: 'menu.items.productCategories',
            route: '/inventory/categories/furniture',
            order: 1,
          },
        ],
      },
    ],
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('เรนเดอร์เมนูหลายระดับและคลิกเลือกเมนูย่อยได้', async () => {
    const pinia = createTestingPinia({ stubActions: false });
    const menuStore = useMenuStore(pinia);
    const router = await createTestRouter([
      { path: '/' },
      { path: '/inventory/products' },
      { path: '/inventory/categories' },
      { path: '/inventory/categories/furniture' },
    ]);
    const pushMock = vi.spyOn(router, 'push').mockResolvedValue(undefined);

    const wrapper = mount(MenuItem, {
      props: {
        item: createMenuItem(),
      },
      global: {
        plugins: [pinia, router],
      },
    });

    const parent = wrapper.find('[data-menu-id="parent"]');
    expect(parent.exists()).toBe(true);
    await parent.trigger('click');
    await flushPromises();

    expect(menuStore.activeMenuItem).toBe('/inventory/products');
    expect(pushMock).toHaveBeenCalledWith('/inventory/products');

    const child = wrapper.find('[data-menu-id="child-1"]');
    expect(child.exists()).toBe(true);
    await child.trigger('click');
    await flushPromises();

    expect(menuStore.activeMenuItem).toBe('/inventory/categories');
    expect(pushMock).toHaveBeenCalledWith('/inventory/categories');

    const grandChild = wrapper.find('[data-menu-id="child-1-1"]');
    expect(grandChild.exists()).toBe(true);
    await grandChild.trigger('click');
    await flushPromises();

    expect(menuStore.activeMenuItem).toBe('/inventory/categories/furniture');
    expect(pushMock).toHaveBeenCalledWith('/inventory/categories/furniture');
  });

  it('ไม่เปลี่ยน route เมื่อ item ถูกตั้งค่า disabled', async () => {
    const pinia = createTestingPinia({ stubActions: false });
    const router = await createTestRouter([
      { path: '/' },
      { path: '/inventory/products' },
    ]);
    const pushMock = vi.spyOn(router, 'push').mockResolvedValue(undefined);

    const wrapper = mount(MenuItem, {
      props: {
        item: createMenuItem({ disabled: true }),
      },
      global: {
        plugins: [pinia, router],
      },
    });

    const parent = wrapper.find('[data-menu-id="parent"]');
    await parent.trigger('click');
    await flushPromises();

    expect(pushMock).not.toHaveBeenCalled();
  });
});

const buildMenuStructure = (): MenuStructure => [
  {
    id: 'sales',
    label: 'menu.categories.sales',
    icon: 'point_of_sale',
    order: 1,
    items: [
      {
        id: 'sales-pos',
        label: 'menu.items.pos',
        route: '/sales/pos',
        icon: 'point_of_sale',
        order: 1,
        items: [
          {
            id: 'sales-pos-v1',
            label: 'menu.items.pos',
            route: '/sales/pos/v1',
            order: 1,
          },
          {
            id: 'sales-pos-v2',
            label: 'menu.items.pos',
            route: '/sales/pos/v2',
            order: 2,
          },
          {
            id: 'sales-pos-settings',
            label: 'menu.items.posSettings',
            route: '/sales/pos/settings',
            icon: 'tune',
            order: 3,
            items: [
              {
                id: 'sales-pos-settings-general',
                label: 'menu.items.posSettingsGeneral',
                route: '/sales/pos/settings/general',
                order: 1,
              },
              {
                id: 'sales-pos-settings-hardware',
                label: 'menu.items.posSettingsHardware',
                route: '/sales/pos/settings/hardware',
                order: 2,
              },
            ],
          },
        ],
      },
    ],
  },
];

describe('MultiLevelMenu component behaviour', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const mountSideMenu = async () => {
    const pinia = createTestingPinia({ stubActions: false });
    const menuStore = useMenuStore(pinia);
    menuStore.setMenuStructure(buildMenuStructure());

    const router = await createTestRouter([
      { path: '/' },
      { path: '/sales/pos' },
      { path: '/sales/pos/v1' },
      { path: '/sales/pos/v2' },
      { path: '/sales/pos/settings' },
      { path: '/sales/pos/settings/hardware' },
    ]);

    const wrapper = mount(SideMenu, {
      global: {
        plugins: [pinia, router],
      },
    });

    await flushPromises();

    return { wrapper, menuStore, router };
  };

  it('สามารถขยายเมนูหลายระดับได้', async () => {
    const { wrapper, menuStore } = await mountSideMenu();

    const category = wrapper.find('[data-testid="menu-category"][data-category-id="sales"]');
    await category.trigger('click');
    expect(menuStore.expandedCategories).toContain('sales');

    const posItem = wrapper.find('[data-menu-id="sales-pos"]');
    await posItem.trigger('click');

    const subItem = wrapper.find('[data-menu-id="sales-pos-v1"]');
    expect(subItem.exists()).toBe(true);
    expect(menuStore.expandedItems).toContain('sales-pos');
  });

  it('คลิกเมนูระดับลึกแล้ว activeMenuItem ถูกตั้งค่า', async () => {
    const { wrapper, menuStore } = await mountSideMenu();

    await wrapper.find('[data-testid="menu-category"][data-category-id="sales"]').trigger('click');
    await wrapper.find('[data-menu-id="sales-pos"]').trigger('click');
    await wrapper.find('[data-menu-id="sales-pos-v2"]').trigger('click');

    expect(menuStore.activeMenuItem).toBe('/sales/pos/v2');
    expect(menuStore.expandedItems).toContain('sales-pos');
  });

  it('เปิด POS settings แล้วเห็นเมนูฮาร์ดแวร์', async () => {
    const { wrapper, menuStore } = await mountSideMenu();

    await wrapper.find('[data-testid="menu-category"][data-category-id="sales"]').trigger('click');
    await wrapper.find('[data-menu-id="sales-pos"]').trigger('click');
    await wrapper.find('[data-menu-id="sales-pos-settings"]').trigger('click');

    const hardware = wrapper.find('[data-menu-id="sales-pos-settings-hardware"]');
    expect(hardware.exists()).toBe(true);
    expect(menuStore.expandedItems).toContain('sales-pos-settings');
  });
});

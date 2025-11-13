import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { createMemoryHistory, createRouter } from 'vue-router';
import SideMenu from '@/components/menu/SideMenu.vue';
import { useMenuStore } from '@/stores/menu-store';
import type { MenuStructure } from '@/types/menu';

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
        ],
      },
    ],
  },
];

const createRouterForTest = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/sales/pos', component: { template: '<div />' } },
      { path: '/sales/pos/v1', component: { template: '<div />' } },
      { path: '/sales/pos/v2', component: { template: '<div />' } },
    ],
  });

  router.push('/');
  await router.isReady();

  return router;
};

const mountSideMenu = async () => {
  const pinia = createTestingPinia({ stubActions: false });
  const router = await createRouterForTest();
  const target = document.createElement('div');
  document.body.appendChild(target);

  const wrapper = mount(SideMenu, {
    attachTo: target,
    global: {
      plugins: [pinia, router],
    },
  });

  const menuStore = useMenuStore(pinia);
  menuStore.setMenuStructure(buildMenuStructure());
  menuStore.expandCategory('sales');
  await flushPromises();

  return { wrapper, menuStore, target };
};

describe('Menu keyboard navigation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('ArrowDown โฟกัสไอเท็มถัดไป', async () => {
    const { wrapper, target } = await mountSideMenu();

    const parent = wrapper.find('[data-menu-id="sales-pos"]');
    expect(parent.exists()).toBe(true);
    await parent.trigger('click');
    await flushPromises();

    expect(wrapper.html()).toContain('data-menu-id="sales-pos"');
    expect(wrapper.html()).toContain('data-menu-id="sales-pos-v1"');
    expect(wrapper.html()).toContain('data-menu-focusable');

    const child = wrapper.find('[data-menu-id="sales-pos-v1"]');
    expect(child.exists()).toBe(true);

    const focusableElements = document.querySelectorAll('[data-menu-focusable="true"]');
    expect(focusableElements.length).toBeGreaterThan(1);

    const focusCalls: HTMLElement[] = [];
    const focusSpy = vi
      .spyOn(window.HTMLElement.prototype, 'focus')
      .mockImplementation(function focusStub(this: HTMLElement) {
        focusCalls.push(this);
      });

    await parent.trigger('keydown', { key: 'ArrowDown' });
    await flushPromises();

    expect(focusCalls.at(-1)?.getAttribute('data-menu-id')).toBe('sales-pos-v1');
    focusSpy.mockRestore();
    wrapper.unmount();
    target.remove();
  });

  it('ArrowUp โฟกัสไอเท็มก่อนหน้า', async () => {
    const { wrapper, target } = await mountSideMenu();

    const parent = wrapper.find('[data-menu-id="sales-pos"]');
    expect(parent.exists()).toBe(true);
    await parent.trigger('click');
    await flushPromises();

    expect(wrapper.html()).toContain('data-menu-id="sales-pos"');
    expect(wrapper.html()).toContain('data-menu-id="sales-pos-v1"');
    expect(wrapper.html()).toContain('data-menu-focusable');

    const child = wrapper.find('[data-menu-id="sales-pos-v1"]');
    expect(child.exists()).toBe(true);

    const focusableElements = document.querySelectorAll('[data-menu-focusable="true"]');
    expect(focusableElements.length).toBeGreaterThan(1);

    const focusCalls: HTMLElement[] = [];
    const focusSpy = vi
      .spyOn(window.HTMLElement.prototype, 'focus')
      .mockImplementation(function focusStub(this: HTMLElement) {
        focusCalls.push(this);
      });

    await child.trigger('keydown', { key: 'ArrowUp' });
    await flushPromises();

    expect(focusCalls.at(-1)?.getAttribute('data-menu-id')).toBe('sales-pos');
    focusSpy.mockRestore();
    wrapper.unmount();
    target.remove();
  });
});


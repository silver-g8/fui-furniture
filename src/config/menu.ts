import type { MenuStructure } from '../types/menu';

export const menuStructure: MenuStructure = [
  {
    id: 'main',
    label: 'menu.categories.main',
    icon: 'dashboard',
    order: 1,
    items: [
      {
        id: 'main-dashboard',
        label: 'menu.items.dashboard',
        route: '/dashboard',
        icon: 'dashboard',
        order: 1,
      },
      {
        id: 'main-products',
        label: 'menu.items.products',
        route: '/inventory/products',
        icon: 'inventory',
        order: 2,
      },
      {
        id: 'main-brands',
        label: 'menu.items.brands',
        route: '/inventory/brands',
        icon: 'branding_watermark',
        order: 3,
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
        route: '/inventory/products',
        icon: 'inventory',
        order: 1,
      },
      {
        id: 'inventory-categories',
        label: 'menu.items.productCategories',
        route: '/inventory/categories',
        icon: 'category',
        order: 2,
      },
      {
        id: 'inventory-brands',
        label: 'menu.items.brands',
        route: '/inventory/brands',
        icon: 'branding_watermark',
        order: 3,
      },
    ],
  },
  {
    id: 'purchases',
    label: 'menu.categories.purchases',
    icon: 'shopping_cart',
    order: 3,
    items: [
      {
        id: 'purchases-orders',
        label: 'menu.items.purchaseOrders',
        route: '/purchases/orders',
        icon: 'receipt_long',
        order: 1,
      },
    ],
  },
  {
    id: 'help',
    label: 'menu.categories.help',
    icon: 'help_outline',
    order: 99,
    items: [
      {
        id: 'help-changelog',
        label: 'menu.items.changelog',
        route: '/help/changelog',
        icon: 'history',
        order: 1,
      },
    ],
  },
];

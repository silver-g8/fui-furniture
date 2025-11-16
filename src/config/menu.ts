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
    id: 'sales',
    label: 'menu.categories.sales',
    icon: 'point_of_sale',
    order: 4,
    items: [
      {
        id: 'sales-customers',
        label: 'menu.items.customers',
        route: '/sales/customers',
        icon: 'people',
        order: 1,
      },
    ],
  },
  {
    id: 'ar',
    label: 'menu.categories.ar',
    icon: 'account_balance_wallet',
    order: 5,
    items: [
      {
        id: 'ar-dashboard',
        label: 'menu.items.ar_dashboard',
        route: '/ar/dashboard',
        icon: 'dashboard',
        order: 1,
      },
      {
        id: 'ar-invoices',
        label: 'menu.items.ar_invoices',
        route: '/ar/invoices',
        icon: 'description',
        order: 2,
      },
      {
        id: 'ar-receipts',
        label: 'menu.items.ar_receipts',
        route: '/ar/receipts',
        icon: 'receipt',
        order: 3,
      },
      {
        id: 'ar-credit-notes',
        label: 'menu.items.ar_credit_notes',
        route: '/ar/credit-notes',
        icon: 'note',
        order: 4,
      },
      {
        id: 'ar-deposits',
        label: 'menu.items.ar_deposits',
        route: '/ar/deposits',
        icon: 'savings',
        order: 5,
      },
      {
        id: 'ar-aging-report',
        label: 'menu.items.ar_aging_report',
        route: '/ar/reports/aging',
        icon: 'analytics',
        order: 6,
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

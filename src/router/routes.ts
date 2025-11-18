import type { RouteRecordRaw } from 'vue-router';
import { menuStructure } from '@/config/menu';
import { useAuthStore } from '@/stores/auth/useAuthStore';

const placeholderComponent = () => import('pages/menu/MenuPlaceholder.vue');

const catalogRoutes: RouteRecordRaw[] = [
  {
    path: 'inventory/products',
    name: 'catalog-products-list',
    component: () => import('pages/catalog/ProductListPage.vue'),
  },
  {
    path: 'inventory/products/create',
    name: 'catalog-products-create',
    component: () => import('pages/catalog/ProductCreatePage.vue'),
  },
  {
    path: 'inventory/products/:id/edit',
    name: 'catalog-products-edit',
    component: () => import('pages/catalog/ProductEditPage.vue'),
    props: true,
  },
  {
    path: 'inventory/products/:id',
    name: 'catalog-products-detail',
    component: () => import('pages/catalog/ProductDetailPage.vue'),
    props: true,
  },
  {
    path: 'inventory/brands',
    name: 'catalog-brands-list',
    component: () => import('pages/catalog/BrandListPage.vue'),
  },
  {
    path: 'inventory/brands/create',
    name: 'catalog-brands-create',
    component: () => import('pages/catalog/BrandCreatePage.vue'),
  },
  {
    path: 'inventory/brands/:id/edit',
    name: 'catalog-brands-edit',
    component: () => import('pages/catalog/BrandEditPage.vue'),
    props: true,
  },
  {
    path: 'inventory/categories',
    name: 'catalog-categories-tree',
    component: () => import('pages/catalog/CategoryTreePage.vue'),
  },
];

const salesRoutes: RouteRecordRaw[] = [
  {
    path: 'sales/customers',
    name: 'sales-customers-list',
    component: () => import('pages/sales/CustomerListPage.vue'),
  },
  {
    path: 'sales/customers/create',
    name: 'sales-customers-create',
    component: () => import('pages/sales/CustomerCreatePage.vue'),
  },
  {
    path: 'sales/customers/:id/edit',
    name: 'sales-customers-edit',
    component: () => import('pages/sales/CustomerEditPage.vue'),
    props: true,
  },
  {
    path: 'sales/customers/:id',
    name: 'sales-customers-detail',
    component: () => import('pages/sales/CustomerDetailPage.vue'),
    props: true,
  },
  // Quotation routes
  {
    path: 'sales/quotations',
    name: 'sales-quotations-list',
    component: () => import('pages/sales/quotations/QuotationListPage.vue'),
  },
  {
    path: 'sales/quotations/create',
    name: 'sales-quotations-create',
    component: () => import('pages/sales/quotations/QuotationCreatePage.vue'),
  },
  {
    path: 'sales/quotations/:id/edit',
    name: 'sales-quotations-edit',
    component: () => import('pages/sales/quotations/QuotationCreatePage.vue'),
    props: true,
  },
  {
    path: 'sales/quotations/:id',
    name: 'sales-quotations-detail',
    component: () => import('pages/sales/quotations/QuotationDetailPage.vue'),
    props: true,
  },
  // Sales Order routes
  {
    path: 'sales/sales-orders',
    name: 'sales-orders-list',
    component: () => import('pages/sales/sales-orders/SalesOrderListPage.vue'),
  },
  {
    path: 'sales/sales-orders/create',
    name: 'sales-orders-create',
    component: () => import('pages/sales/sales-orders/SalesOrderCreatePage.vue'),
  },
  {
    path: 'sales/sales-orders/:id/edit',
    name: 'sales-orders-edit',
    component: () => import('pages/sales/sales-orders/SalesOrderCreatePage.vue'),
    props: true,
  },
  {
    path: 'sales/sales-orders/:id',
    name: 'sales-orders-detail',
    component: () => import('pages/sales/sales-orders/SalesOrderDetailPage.vue'),
    props: true,
  },
  // Cash Sale
  {
    path: 'sales/cash-sale',
    name: 'sales-cash-sale',
    component: () => import('pages/sales/cash-sale/CashSalePage.vue'),
  },
  // Sales Reports
  {
    path: 'sales/reports',
    name: 'sales-reports',
    component: () => import('pages/sales/reports/SalesReportPage.vue'),
  },
];

const arRoutes: RouteRecordRaw[] = [
  {
    path: 'ar/invoices',
    name: 'ar-invoices',
    component: () => import('pages/ar/invoices/InvoiceListPage.vue'),
  },
  {
    path: 'ar/invoices/:id',
    name: 'ar-invoices-detail',
    component: () => import('pages/ar/invoices/InvoiceDetailPage.vue'),
    props: true,
  },
  {
    path: 'ar/receipts',
    name: 'ar-receipts',
    component: () => import('pages/ar/receipts/ReceiptListPage.vue'),
  },
  {
    path: 'ar/receipts/:id',
    name: 'ar-receipts-detail',
    component: () => import('pages/ar/receipts/ReceiptDetailPage.vue'),
    props: true,
  },
  {
    path: 'ar/credit-notes',
    name: 'ar-credit-notes',
    component: () => import('pages/ar/credit-notes/CreditNoteListPage.vue'),
  },
  {
    path: 'ar/credit-notes/:id',
    name: 'ar-credit-notes-detail',
    component: () => import('pages/ar/credit-notes/CreditNoteDetailPage.vue'),
    props: true,
  },
  {
    path: 'ar/deposits',
    name: 'ar-deposits',
    component: () => import('pages/ar/deposits/DepositListPage.vue'),
  },
  {
    path: 'ar/deposits/:id',
    name: 'ar-deposits-detail',
    component: () => import('pages/ar/deposits/DepositDetailPage.vue'),
    props: true,
  },
  {
    path: 'ar/dashboard',
    name: 'ar-dashboard',
    component: () => import('pages/ar/ArDashboardPage.vue'),
  },
  {
    path: 'ar/reports/aging',
    name: 'ar-aging-report',
    component: () => import('pages/ar/reports/AgingReportPage.vue'),
  },
  {
    path: 'ar/reports/statement',
    name: 'ar-statement-report',
    component: () => import('pages/ar/reports/StatementReportPage.vue'),
  },
  {
    path: 'ar/pending-payments',
    name: 'ar-pending-payments',
    component: () => import('pages/ar/PendingPaymentPage.vue'),
  },
];

const seenPaths = new Set<string>([
  'dashboard',
  'auth/login',
  ...catalogRoutes.map((route) => route.path),
  ...salesRoutes.map((route) => route.path),
  ...arRoutes.map((route) => route.path),
]);

const buildMenuRoutes = (): RouteRecordRaw[] => {
  const routes: RouteRecordRaw[] = [];

  const appendRoute = (routePath: string | undefined, name: string) => {
    if (!routePath) {
      return;
    }

    const normalized = routePath.startsWith('/') ? routePath.slice(1) : routePath;
    if (!normalized.length || seenPaths.has(normalized)) {
      return;
    }

    seenPaths.add(normalized);
    routes.push({
      path: normalized,
      name,
      component: placeholderComponent,
      meta: {
        requiresAuth: true,
      },
    });
  };

  const walkItems = (items: (typeof menuStructure)[number]['items']) => {
    items.forEach((item) => {
      appendRoute(item.route, `menu-${item.id}`);
      if (item.items?.length) {
        walkItems(item.items);
      }
    });
  };

  menuStructure.forEach((category) => {
    walkItems(category.items);
  });

  return routes;
};

const menuRoutes = buildMenuRoutes();

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        redirect: () => {
          // Import here to avoid circular dependency
          const authStore = useAuthStore();
          return authStore.isAuthenticated ? '/dashboard' : { name: 'auth-login' };
        },
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('pages/Dashboard.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      ...catalogRoutes.map((route) => ({
        ...route,
        meta: {
          ...(route.meta ?? {}),
          requiresAuth: true,
        },
      })),
      ...salesRoutes.map((route) => ({
        ...route,
        meta: {
          ...(route.meta ?? {}),
          requiresAuth: true,
        },
      })),
      ...arRoutes.map((route) => ({
        ...route,
        meta: {
          ...(route.meta ?? {}),
          requiresAuth: true,
        },
      })),
      ...menuRoutes,
    ],
  },
  {
    path: '/auth',
    component: () => import('layouts/AuthLayout.vue'),
    meta: {
      requiresAuth: false,
    },
    children: [
      {
        path: '',
        redirect: { name: 'auth-login' },
      },
      {
        path: 'login',
        name: 'auth-login',
        component: () => import('pages/auth/LoginPage.vue'),
        meta: {
          guestOnly: true,
          requiresAuth: false,
        },
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
    meta: {
      requiresAuth: false,
    },
  },
];

export default routes;

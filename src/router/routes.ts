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
];

const seenPaths = new Set<string>([
  'dashboard',
  'auth/login',
  ...catalogRoutes.map((route) => route.path),
  ...salesRoutes.map((route) => route.path),
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

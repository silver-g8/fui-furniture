# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**roiet APP (fui-furniture)** - Vue 3 + Quasar 2 frontend SPA for a furniture inventory management system.

### Technology Stack
- **Frontend**: TypeScript 5.9 (strict mode), Vue 3.5+ (Composition API with `<script setup>`), Quasar 2.18.5
- **State Management**: Pinia 3
- **HTTP Client**: Axios 1.x with Laravel Sanctum authentication
- **i18n**: vue-i18n 11 (Thai/English bilingual support)
- **Testing**: Vitest 4 with happy-dom
- **Build**: Vite via Quasar CLI

### Repository Structure
```
C:\Users\silve\
├── Herd\
│   └── furniture-api\        # Laravel 12 backend API (separate repo)
└── project\roiet\
    ├── specs\main\           # Feature specification documents
    └── fui-furniture\        # This frontend application
```

**Important**: When referencing the backend, use `../../Herd/furniture-api/` or the absolute path above.

## Development Commands

### Setup
```bash
# Install dependencies
npm install

# Configure environment (required before first run)
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL=http://furniture-api.test/api/v1
```

### Development
```bash
# Start dev server (opens browser automatically)
npm run dev
# or
quasar dev

# Run linter
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

### Build
```bash
# Production build
quasar build
```

## Architecture

### Authentication Flow
- **Boot sequence**: `src/boot/auth.ts` → hydrates session from storage → guards routes
- **Session storage**: In-memory (default) + `sessionStorage` (default) + `localStorage` (when "Remember Me" enabled)
- **Token management**: `src/boot/axios.ts` automatically injects Bearer token from `useAuthStore()` into all API requests
- **401 handling**: Axios interceptor clears session and dispatches `app:unauthorized` event globally

### API Integration
- **Base URL**: Configured via `VITE_API_BASE_URL` in `.env`
- **Proxy**: Dev server proxies `/api` and `/sanctum` to `http://furniture-api.test` (see `quasar.config.ts:123-134`)
- **CSRF**: Uses `withCredentials: true` with XSRF-TOKEN header
- **Error normalization**: `src/boot/axios.ts` provides `normalizeAxiosError()` and `toError()` for consistent error handling

### Module Structure

**Catalog Module** (`src/pages/catalog/`, `src/stores/catalog/`, `src/services/catalog/`):
- Products: CRUD with SKU, price, cost, description, brand, category, on-hand quantity, image_url
- Brands: CRUD with code, name, slug, website, logo, isActive
- Categories: Tree view with hierarchical navigation

### Key Composables (Developer Utilities)
- `useNotifier.ts` – Standardized success/error/info notifications
- `useLoadingOverlay.ts` – Wraps async calls with Quasar Loading overlay
- `useTableFilters.ts` – Manages table state and syncs with URL query params
- `useCrudForm.ts` – Handles create/edit form state with success/error messaging

### Routing
- **Dynamic routes**: Built from `src/config/menu.ts` structure via `buildMenuRoutes()` in `src/router/routes.ts`
- **Auth guard**: Routes with `meta.requiresAuth: true` redirect to `/auth/login` if not authenticated
- **Guest guard**: Login page has `meta.guestOnly: true` to prevent authenticated access
- **Route mode**: Uses hash mode (`vueRouterMode: 'hash'`)

### Path Aliases (Vite)
```typescript
'@' | '@@' | 'src'         → ./src
'components'               → ./src/components
'layouts'                  → ./src/layouts
'pages'                    → ./src/pages
'stores'                   → ./src/stores
'services'                 → ./src/services
'boot'                     → ./src/boot
'i18n'                     → ./src/i18n
'mocks'                    → ./src/mocks
```

### Internationalization
- **Default locale**: Thai (`th-TH`)
- **Supported locales**: `en-US`, `th-TH`
- **Structure**: Each module has its own i18n namespace (e.g., `src/i18n/th-TH/catalog.ts`)
- **Usage**: All user-facing text must use `$t()` or `t()` from vue-i18n

## Code Conventions

### Response Language
- **Always respond in Thai** in chat/message context (per `.cursorrules`)

### TypeScript
- Strict mode enabled (`quasar.config.ts:42`)
- Use Composition API with `<script setup>` for all Vue components
- Prefer interfaces over types for object shapes
- Use type inference where possible

### Vue Components
- Single File Components (SFC) with `<script setup lang="ts">`
- Quasar components auto-imported (no manual imports needed)
- Use Quasar Notify and Loading plugins (globally registered in `quasar.config.ts:152`)

### API Services Pattern
```typescript
// services/catalog/product.service.ts
import { api } from 'boot/axios';
import type { Product, ApiListResponse } from '@/types/catalog';

export const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await api.get<ApiListResponse<Product>>('/products');
  return data.data;
};
```

### Store Pattern (Pinia)
- One store per domain (e.g., `useBrandStore`, `useProductStore`)
- Hydrate from API in actions, not directly in components
- Use getters for derived/computed state

### Error Handling
- Use `try/catch` with `useNotifier()` for user-facing errors
- API errors already normalized by axios interceptor
- Display validation errors from `error.errors` object

## Testing
- Unit tests with Vitest + @vue/test-utils
- Test files colocated with source (same directory) or in `src/__tests__/`
- Use `happy-dom` for DOM environment
- Pinia testing via `@pinia/testing`

## Build Configuration
- Target: ES2022, Firefox 115+, Chrome 115+, Safari 14+
- Vite plugins: vue-i18n, vite-plugin-checker (ESLint + TypeScript)
- TypeScript checking enabled in dev mode
- Dev server opens browser automatically

## Common Patterns

### Loading State with Overlay
```typescript
import { useLoadingOverlay } from '@/composables/useLoadingOverlay';

const { withLoading } = useLoadingOverlay();
await withLoading(async () => {
  await someAsyncOperation();
});
```

### Table Filters with URL Sync
```typescript
import { useTableFilters } from '@/composables/useTableFilters';

const { filters, updateFilter, resetFilters } = useTableFilters({
  search: '',
  status: null,
});
```

### CRUD Form
```typescript
import { useCrudForm } from '@/composables/useCrudForm';

const { isEditing, showSuccess, showError } = useCrudForm({
  entityId: props.id,
  createSuccessMessage: 'Product created',
  updateSuccessMessage: 'Product updated',
});
```

## Active Features (from specs/main)
- Dashboard with widgets (metrics, charts, tables)
- Side menu navigation with categories
- Product catalog (CRUD with brand/category relations, stock adjustments)
- Brand management
- Category tree view
- Authentication (login/logout with Sanctum)
- Thai language support throughout UI

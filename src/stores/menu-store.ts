import { acceptHMRUpdate, defineStore } from 'pinia';
import type { MenuCategory, MenuItem, MenuState, MenuStructure } from '@/types/menu';
import { menuStructure as defaultMenuStructure } from '@/config/menu';
import { useMenu } from '@/composables/useMenu';

const STORAGE_KEY = 'fui-menu-state';

const isClient = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const persistState = (state: MenuState) => {
  if (!isClient()) {
    return;
  }

  const payload = {
    leftDrawerOpen: state.leftDrawerOpen,
    expandedCategories: state.expandedCategories,
    expandedItems: state.expandedItems,
    activeMenuItem: state.activeMenuItem,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const loadPersistedState = (): Partial<MenuState> | null => {
  if (!isClient()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as Partial<MenuState>;
  } catch {
    return null;
  }
};

const normalizePersistedState = (
  structure: MenuStructure,
  persisted: Partial<MenuState> | null,
): Partial<MenuState> | null => {
  if (!persisted) {
    return null;
  }

  const { categories, flattened } = useMenu(structure);
  const validCategoryIds = new Set(categories.map((category) => category.id));
  const validItemIds = new Set(flattened.map((item) => item.id));

  return {
    leftDrawerOpen: persisted.leftDrawerOpen ?? false,
    expandedCategories: (persisted.expandedCategories ?? []).filter((id) =>
      validCategoryIds.has(id),
    ),
    expandedItems: (persisted.expandedItems ?? []).filter((id) => validItemIds.has(id)),
    activeMenuItem: persisted.activeMenuItem ?? null,
  };
};

const sortMenuStructure = (structure: MenuStructure): MenuStructure => {
  const sortItems = (items: MenuItem[]): MenuItem[] =>
    [...items]
      .map((item) => ({
        ...item,
        ...(item.items ? { items: sortItems(item.items) } : {}),
      }))
      .sort((a, b) => a.order - b.order);

  return [...structure]
    .map((category) => ({
      ...category,
      items: sortItems(category.items),
    }))
    .sort((a, b) => a.order - b.order);
};

const createInitialState = (): MenuState => {
  const sortedStructure = sortMenuStructure(defaultMenuStructure);
  const persisted = normalizePersistedState(sortedStructure, loadPersistedState());

  return {
    leftDrawerOpen: persisted?.leftDrawerOpen ?? false,
    expandedCategories:
      persisted?.expandedCategories ?? sortedStructure.map((category) => category.id),
    expandedItems: persisted?.expandedItems ?? [],
    activeMenuItem: persisted?.activeMenuItem ?? null,
    menuStructure: sortedStructure,
  };
};

const addUnique = (collection: string[], id: string) => {
  if (!collection.includes(id)) {
    collection.push(id);
  }
};

export const useMenuStore = defineStore('menu', {
  state: createInitialState,

  getters: {
    categories: (state): MenuCategory[] => state.menuStructure,
    isCategoryExpanded: (state) => (categoryId: string) =>
      state.expandedCategories.includes(categoryId),
    isItemExpanded: (state) => (itemId: string) => state.expandedItems.includes(itemId),
    activeCategoryId: (state) => {
      const activeRoute = state.activeMenuItem;
      if (!activeRoute) {
        return null;
      }

      const category = state.menuStructure.find((c) =>
        c.items.some((item) => item.route === activeRoute),
      );

      return category?.id ?? null;
    },
  },

  actions: {
    persist() {
      persistState(this.$state);
    },

    ensureVisibilityForRoute(route: string) {
      const { getBreadcrumbs } = useMenu(this.menuStructure);
      const breadcrumbs = getBreadcrumbs(route);
      if (!breadcrumbs.length) {
        return;
      }

      const category = breadcrumbs[0] as MenuCategory;
      const items = breadcrumbs.slice(1);

      this.expandCategory(category.id);

      items.forEach((item, index) => {
        if ('id' in item) {
          const hasChildren = 'items' in item && Array.isArray(item.items) && item.items.length > 0;
          if (index < items.length - 1 || hasChildren) {
            this.expandItem(item.id);
          }
        }
      });
    },

    setMenuStructure(structure: MenuStructure) {
      const sorted = sortMenuStructure(structure);
      this.menuStructure = sorted;

      const normalized = normalizePersistedState(sorted, loadPersistedState());
      this.expandedCategories = normalized?.expandedCategories ?? [];
      this.expandedItems = normalized?.expandedItems ?? [];

      const activeRoute = normalized?.activeMenuItem ?? this.activeMenuItem;
      if (activeRoute) {
        this.ensureVisibilityForRoute(activeRoute);
      }

      this.persist();
    },

    toggleDrawer() {
      this.leftDrawerOpen = !this.leftDrawerOpen;
      this.persist();
    },

    setDrawer(open: boolean) {
      this.leftDrawerOpen = open;
      this.persist();
    },

    expandCategory(categoryId: string) {
      addUnique(this.expandedCategories, categoryId);
      this.persist();
    },

    collapseCategory(categoryId: string) {
      this.expandedCategories = this.expandedCategories.filter((id) => id !== categoryId);
      this.persist();
    },

    toggleCategory(categoryId: string) {
      if (this.expandedCategories.includes(categoryId)) {
        this.collapseCategory(categoryId);
      } else {
        this.expandCategory(categoryId);
      }
    },

    expandItem(itemId: string) {
      addUnique(this.expandedItems, itemId);
      this.persist();
    },

    collapseItem(itemId: string) {
      this.expandedItems = this.expandedItems.filter((id) => id !== itemId);
      this.persist();
    },

    toggleItem(itemId: string) {
      if (this.expandedItems.includes(itemId)) {
        this.collapseItem(itemId);
      } else {
        this.expandItem(itemId);
      }
    },

    setActiveMenuItem(route: string | null) {
      this.activeMenuItem = route;
      if (route) {
        this.ensureVisibilityForRoute(route);
      }
      this.persist();
    },

    reset() {
      if (isClient()) {
        window.localStorage.removeItem(STORAGE_KEY);
      }

      Object.assign(this, createInitialState());
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMenuStore, import.meta.hot));
}


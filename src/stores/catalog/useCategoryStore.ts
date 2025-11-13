import { acceptHMRUpdate, defineStore } from 'pinia';
import type { CategoryNode } from '@/types/catalog';
import { fetchCategoryTree } from '@/services/catalog/category.service';

interface CategoryState {
  tree: CategoryNode[];
  selected: CategoryNode | null;
  loading: boolean;
  error: string | null;
}

const initialState = (): CategoryState => ({
  tree: [],
  selected: null,
  loading: false,
  error: null,
});

export const useCategoryStore = defineStore('catalog-categories', {
  state: initialState,

  getters: {
    hasTree: (state) => state.tree.length > 0,
  },

  actions: {
    reset() {
      Object.assign(this, initialState());
    },

    setSelected(node: CategoryNode | null) {
      this.selected = node;
    },

    async loadTree() {
      this.loading = true;
      this.error = null;

      try {
        const data = await fetchCategoryTree();
        this.tree = data;
        if (!this.selected && data.length > 0) {
          this.selected = data[0] ?? null;
        }
      } catch (error) {
        this.tree = [];
        this.error = error instanceof Error ? error.message : 'Failed to load categories';
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCategoryStore, import.meta.hot));
}


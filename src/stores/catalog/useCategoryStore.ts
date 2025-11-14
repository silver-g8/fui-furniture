import { acceptHMRUpdate, defineStore } from 'pinia';
import type {
  CategoryCreatePayload,
  CategoryNode,
  CategoryUpdatePayload,
} from '@/types/catalog';
import {
  createCategory as createCategoryService,
  deleteCategory as deleteCategoryService,
  fetchCategoryTree,
  updateCategory as updateCategoryService,
} from '@/services/catalog/category.service';

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

    findById(id: number): CategoryNode | null {
      const findNode = (nodes: CategoryNode[], targetId: number): CategoryNode | null => {
        for (const node of nodes) {
          if (node.id === targetId) {
            return node;
          }
          const found = findNode(node.children ?? [], targetId);
          if (found) {
            return found;
          }
        }
        return null;
      };
      return findNode(this.tree, id);
    },

    getParentName(id: number): string {
      const node = this.findById(id);
      if (!node?.parentId) {
        return '';
      }
      const parent = this.findById(node.parentId);
      return parent?.name ?? '';
    },

    async createCategory(payload: CategoryCreatePayload): Promise<CategoryNode> {
      this.loading = true;
      this.error = null;

      try {
        const category = await createCategoryService(payload);
        await this.loadTree();
        return category;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create category';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateCategory(id: number, payload: CategoryUpdatePayload): Promise<CategoryNode> {
      this.loading = true;
      this.error = null;

      try {
        const category = await updateCategoryService(id, payload);
        await this.loadTree();
        // Update selected if it matches the updated category
        if (this.selected?.id === id) {
          const updated = this.findById(id);
          if (updated) {
            this.setSelected(updated);
          }
        }
        return category;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update category';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteCategory(id: number): Promise<void> {
      this.loading = true;
      this.error = null;

      try {
        await deleteCategoryService(id);
        // Clear selection if deleted node was selected
        if (this.selected?.id === id) {
          this.setSelected(null);
        }
        await this.loadTree();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete category';
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


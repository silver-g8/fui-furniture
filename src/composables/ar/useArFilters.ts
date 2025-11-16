/**
 * AR Filters Composable
 * จัดการ filters และ query parameters สำหรับหน้า AR ต่างๆ
 */

import { ref, watch, type Ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

export interface ArFilterOptions<T> {
  initialValues: T;
  syncWithUrl?: boolean; // Sync filters with URL query params
}

/**
 * Composable สำหรับจัดการ filters ใน AR module
 * รองรับการ sync กับ URL query parameters
 */
export function useArFilters<T extends Record<string, unknown>>(options: ArFilterOptions<T>) {
  const router = useRouter();
  const route = useRoute();

  // Initialize filters from URL or default values
  const filters = ref<T>({ ...options.initialValues }) as Ref<T>;

  // Load initial values from URL if sync is enabled
  if (options.syncWithUrl) {
    const queryFilters = { ...route.query };
    Object.keys(options.initialValues).forEach((key) => {
      if (key in queryFilters) {
        const value = queryFilters[key];
        if (value !== null && value !== undefined) {
          // Type conversion based on initial value type
          const initialValue = options.initialValues[key as keyof T];
          if (typeof initialValue === 'number') {
            (filters.value as unknown as Record<string, unknown>)[key] = Number(
              value,
            ) as T[Extract<keyof T, string>];
          } else if (typeof initialValue === 'boolean') {
            (filters.value as unknown as Record<string, unknown>)[key] = (value === 'true' ||
              value === '1') as T[Extract<keyof T, string>];
          } else {
            (filters.value as unknown as Record<string, unknown>)[key] = value as T[Extract<
              keyof T,
              string
            >];
          }
        }
      }
    });
  }

  // Update URL when filters change
  if (options.syncWithUrl) {
    watch(
      filters,
      (newFilters) => {
        const query: Record<string, string> = {};
        Object.keys(newFilters).forEach((key) => {
          const value = (newFilters as unknown as Record<string, unknown>)[key];
          if (value !== null && value !== undefined && value !== '') {
            if (typeof value === 'string') {
              query[key] = value;
            } else if (typeof value === 'number' || typeof value === 'boolean') {
              query[key] = String(value);
            } else {
              query[key] = JSON.stringify(value);
            }
          }
        });
        void router.replace({ query });
      },
      { deep: true },
    );
  }

  /**
   * Update a single filter value
   */
  const updateFilter = <K extends keyof T>(key: K, value: T[K]) => {
    (filters.value as unknown as Record<string, unknown>)[key as string] = value as unknown;
  };

  /**
   * Update multiple filter values at once
   */
  const updateFilters = (newFilters: Partial<T>) => {
    Object.assign(filters.value as unknown as Record<string, unknown>, newFilters);
  };

  /**
   * Reset all filters to initial values
   */
  const resetFilters = () => {
    Object.assign(filters.value as unknown as Record<string, unknown>, options.initialValues);
  };

  /**
   * Clear a specific filter (set to null/undefined)
   */
  const clearFilter = <K extends keyof T>(key: K) => {
    (filters.value as unknown as Record<string, unknown>)[key as string] = null;
  };

  /**
   * Check if filters have been changed from initial values
   */
  const hasActiveFilters = (): boolean => {
    return Object.keys(filters.value).some((key) => {
      const current = (filters.value as unknown as Record<string, unknown>)[key];
      const initial = (options.initialValues as unknown as Record<string, unknown>)[key];
      return current !== initial && current !== null && current !== undefined && current !== '';
    });
  };

  /**
   * Get API-ready params (removes null/undefined values)
   */
  const getApiParams = (): Partial<T> => {
    const params: Partial<T> = {};
    Object.keys(filters.value).forEach((key) => {
      const value = (filters.value as unknown as Record<string, unknown>)[key];
      if (value !== null && value !== undefined && value !== '') {
        (params as unknown as Record<string, unknown>)[key] = value;
      }
    });
    return params;
  };

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    clearFilter,
    hasActiveFilters,
    getApiParams,
  };
}

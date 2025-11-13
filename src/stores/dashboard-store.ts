import { acceptHMRUpdate, defineStore } from 'pinia';
import { getDashboardData } from '@/services/dashboard-service';
import type { DashboardState, DashboardWidget } from '@/types/dashboard';

interface FetchOptions {
  refresh?: boolean;
}

const initialState = (): DashboardState => ({
  widgets: [],
  lastUpdated: null,
  loading: false,
  error: null,
});

export const useDashboardStore = defineStore('dashboard', {
  state: initialState,

  getters: {
    widgetCount: (state) => state.widgets.length,
    hasError: (state) => state.error !== null,
  },

  actions: {
    setWidgets(widgets: DashboardWidget[]) {
      this.widgets = widgets;
    },

    setError(message: string | null) {
      this.error = message;
    },

    reset() {
      Object.assign(this, initialState());
    },

    async fetchDashboardData(options: FetchOptions = {}) {
      const refresh = options.refresh ?? false;

      this.loading = true;
      this.error = null;

      try {
        const { widgets, lastUpdated } = await getDashboardData({ refresh });
        this.widgets = widgets;
        this.lastUpdated = lastUpdated ? new Date(lastUpdated) : null;
      } catch (error) {
        this.widgets = [];
        this.error = error instanceof Error ? error.message : 'Unknown error';
      } finally {
        this.loading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDashboardStore, import.meta.hot));
}


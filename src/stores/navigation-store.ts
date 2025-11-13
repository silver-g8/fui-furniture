import { defineStore, acceptHMRUpdate } from 'pinia';
import type { NavigationState } from '@/types/menu';

const STORAGE_KEY = 'fui-navigation-state';

const isClient = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const persistState = (state: NavigationState) => {
  if (!isClient()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // swallow
  }
};

const loadPersistedState = (): Partial<NavigationState> | null => {
  if (!isClient()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<NavigationState>;
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const createInitialState = (): NavigationState => {
  const persisted = loadPersistedState();

  return {
    currentRoute: typeof persisted?.currentRoute === 'string' ? persisted.currentRoute : '/',
    previousRoute:
      typeof persisted?.previousRoute === 'string' && persisted.previousRoute.length
        ? persisted.previousRoute
        : null,
    routeParams:
      (persisted?.routeParams && typeof persisted.routeParams === 'object'
        ? persisted.routeParams
        : {}) ?? {},
    queryParams:
      (persisted?.queryParams && typeof persisted.queryParams === 'object'
        ? persisted.queryParams
        : {}) ?? {},
  };
};

export const useNavigationStore = defineStore('navigation', {
  state: (): NavigationState => createInitialState(),

  actions: {
    setCurrentRoute(
      route: string,
      params: Record<string, unknown> = {},
      query: Record<string, unknown> = {},
    ) {
      this.previousRoute = this.currentRoute;
      this.currentRoute = route;
      this.routeParams = params;
      this.queryParams = query;

      persistState({
        currentRoute: this.currentRoute,
        previousRoute: this.previousRoute,
        routeParams: this.routeParams,
        queryParams: this.queryParams,
      });
    },
    reset() {
      this.currentRoute = '/';
      this.previousRoute = null;
      this.routeParams = {};
      this.queryParams = {};

      persistState({
        currentRoute: this.currentRoute,
        previousRoute: this.previousRoute,
        routeParams: this.routeParams,
        queryParams: this.queryParams,
      });
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNavigationStore, import.meta.hot));
}


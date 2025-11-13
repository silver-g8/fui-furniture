/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { computed, onMounted, reactive, watch, type UnwrapNestedRefs } from 'vue';
import { useRoute, useRouter, type LocationQuery, type LocationQueryValue } from 'vue-router';

type Parsers<F extends Record<string, unknown>> = {
  [K in keyof F]?: (value: LocationQueryValue | LocationQueryValue[] | undefined) => F[K];
};
type Serializers<F extends Record<string, unknown>> = {
  [K in keyof F]?: (value: F[K]) => string | undefined;
};
type QueryMap<F extends Record<string, unknown>> = { [K in keyof F]?: string };

interface UseTableFiltersOptions<F extends Record<string, unknown>> {
  defaults: F;
  parsers?: Parsers<F>;
  serializers?: Serializers<F>;
  queryMap?: QueryMap<F>;
  routeSync?: boolean;
  onRouteChange?: (filters: F) => void;
}

interface UpdateOptions {
  syncRoute?: boolean;
}

const defaultSerializer = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'string') {
    return value;
  }

  return undefined;
};

export const useTableFilters = <F extends Record<string, unknown>>({
  defaults,
  parsers = {},
  serializers = {},
  queryMap = {},
  routeSync = true,
  onRouteChange,
}: UseTableFiltersOptions<F>) => {
  const route = useRoute();
  const router = useRouter();

  const filters = reactive({ ...defaults }) as UnwrapNestedRefs<F>;
  let updatingFromRoute = false;

  const getQueryKey = (key: keyof F) => queryMap[key] ?? String(key);

  const parseValue = <K extends keyof F>(
    key: K,
    value: LocationQueryValue | LocationQueryValue[] | undefined,
  ): F[K] => {
    const parser = parsers[key];
    if (parser) {
      return parser(value);
    }

    const defaultValue = defaults[key] as F[K];

    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }

    if (typeof defaultValue === 'number') {
      const raw = Array.isArray(value) ? value[0] : value;
      const parsed = Number(raw);
      return (Number.isNaN(parsed) ? defaultValue : parsed) as F[K];
    }

    if (typeof defaultValue === 'boolean') {
      const normalized = Array.isArray(value) ? value[0] : value;
      return (normalized === '1' || normalized === 'true') as F[K];
    }

    if (typeof defaultValue === 'string') {
      const normalized = Array.isArray(value) ? value[0] : value;
      return (typeof normalized === 'string' ? normalized : String(normalized)) as F[K];
    }

    return defaultValue;
  };

  const serializeValue = <K extends keyof F>(key: K, value: F[K]) => {
    if (serializers[key]) {
      return serializers[key]!(value);
    }

    return defaultSerializer(value);
  };

  const filterTarget = filters as Record<keyof F, unknown>;

  const applyFromRoute = (source: LocationQuery = route.query) => {
    updatingFromRoute = true;
    (Object.keys(defaults) as Array<keyof F>).forEach((key) => {
      const queryKey = getQueryKey(key);
      const value = source[queryKey];
      const parsed = parseValue(key, value);
      filterTarget[key] = parsed as F[typeof key];
    });
    updatingFromRoute = false;
  };

  const syncRoute = async () => {
    if (!routeSync) {
      return;
    }

    const newQuery: LocationQuery = { ...route.query };

    (Object.keys(defaults) as Array<keyof F>).forEach((key) => {
      const queryKey = getQueryKey(key);
      const value = serializeValue(key, filterTarget[key] as F[typeof key]);

      if (value === undefined) {
        delete newQuery[queryKey];
      } else {
        newQuery[queryKey] = value;
      }
    });

    await router.replace({ query: newQuery }).catch(() => undefined);
  };

  const updateFilters = (partial: Partial<F>, options: UpdateOptions = {}) => {
    Object.assign(filters, partial);

    if (options.syncRoute ?? true) {
      void syncRoute();
    }
  };

  const resetFilters = (options: UpdateOptions = {}) => {
    Object.assign(filters, defaults);
    if (options.syncRoute ?? true) {
      void syncRoute();
    }
  };

  if (routeSync) {
    watch(
      () => route.query,
      (query) => {
        if (updatingFromRoute) {
          return;
        }
        applyFromRoute(query);
        onRouteChange?.({ ...(filters as unknown as F) });
      },
      { immediate: false },
    );
  }

  onMounted(() => {
    if (routeSync) {
      applyFromRoute();
    }
  });

  const reactiveFilters = computed(() => filters);

  return {
    filters,
    reactiveFilters,
    updateFilters,
    resetFilters,
    applyFromRoute,
    syncRoute,
  };
};


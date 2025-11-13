import type { ApiItemResponse, ApiListResponse, CategoryNode, ListParams } from '@/types/catalog';
import { catalogApi, mapPaginationMeta } from './api';

const CATEGORY_ENDPOINT = '/categories';

interface CategoryNodeDto {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  is_active: boolean;
  depth?: number;
  children?: CategoryNodeDto[];
}

type CategoryListResponseDto =
  | CategoryNodeDto[]
  | {
      data?: CategoryNodeDto[];
      meta?: {
        page?: number;
        current_page?: number;
        per_page?: number;
        perPage?: number;
        total?: number;
        last_page?: number;
        lastPage?: number;
      };
    };

const buildFallbackMeta = (itemsCount: number, params: ListParams = {}): ApiListResponse<CategoryNode>['meta'] => ({
  page: params.page ?? 1,
  perPage: params.perPage ?? itemsCount,
  total: itemsCount,
  lastPage: 1,
});

const normalizeMeta = (
  meta: NonNullable<Exclude<CategoryListResponseDto, CategoryNodeDto[]>['meta']>,
  itemsCount: number,
  params: ListParams = {},
) => {
  const page = meta.page ?? meta.current_page ?? params.page ?? 1;
  const perPage = meta.per_page ?? meta.perPage ?? params.perPage ?? (itemsCount || 1);
  const total = meta.total ?? itemsCount;
  const lastPage =
    meta.last_page ??
    meta.lastPage ??
    Math.max(1, Math.ceil(total / (perPage || 1)));

  return mapPaginationMeta({
    page,
    per_page: perPage,
    total,
    last_page: lastPage,
  });
};

const mapCategory = (dto: CategoryNodeDto): CategoryNode => ({
  id: dto.id,
  name: dto.name,
  slug: dto.slug,
  parentId: dto.parent_id ?? null,
  isActive: dto.is_active,
  ...(dto.depth !== undefined ? { depth: dto.depth } : {}),
  children: Array.isArray(dto.children) ? dto.children.map(mapCategory) : [],
});

export const fetchCategoryTree = async (): Promise<CategoryNode[]> => {
  const { data } = await catalogApi.get<ApiItemResponse<CategoryNodeDto[]>>(CATEGORY_ENDPOINT, {
    params: { tree: 1 },
  });

  return Array.isArray(data.data) ? data.data.map(mapCategory) : [];
};

export const fetchCategoryList = async (params: ListParams = {}): Promise<ApiListResponse<CategoryNode>> => {
  const { data: payload } = await catalogApi.get<CategoryListResponseDto>(CATEGORY_ENDPOINT, {
    params: {
      search: params.search ?? undefined,
      page: params.page ?? undefined,
      per_page: params.perPage ?? undefined,
    },
  });

  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data ?? []
      : [];

  const meta =
    !Array.isArray(payload) && payload?.meta
      ? normalizeMeta(payload.meta, items.length, params)
      : buildFallbackMeta(items.length, params);

  return {
    data: items.map(mapCategory),
    meta,
  };
};

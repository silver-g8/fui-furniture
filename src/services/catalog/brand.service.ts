import type { ApiItemResponse, ApiListResponse, Brand, ListParams } from '@/types/catalog';
import { catalogApi, mapListParamsToQuery, mapPaginationMeta } from './api';

const BRAND_ENDPOINT = '/brands';

interface BrandDto {
  id: number;
  name: string;
  slug: string;
  code: string;
  website_url?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BrandListResponseDto {
  data: BrandDto[];
  meta: Parameters<typeof mapPaginationMeta>[0];
}

export interface BrandPayload {
  name: string;
  slug?: string;
  code: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
}

const mapBrand = (dto: BrandDto): Brand => ({
  id: dto.id,
  name: dto.name,
  slug: dto.slug,
  code: dto.code,
  websiteUrl: dto.website_url ?? null,
  logoUrl: dto.logo_url ?? null,
  isActive: dto.is_active,
  createdAt: dto.created_at,
  updatedAt: dto.updated_at,
});

const toApiPayload = (payload: BrandPayload) => ({
  name: payload.name,
  slug: payload.slug,
  code: payload.code,
  website_url: payload.websiteUrl ?? null,
  logo_url: payload.logoUrl ?? null,
  is_active: payload.isActive,
});

export const fetchBrands = async (params: ListParams = {}): Promise<ApiListResponse<Brand>> => {
  const { data } = await catalogApi.get<BrandListResponseDto>(BRAND_ENDPOINT, {
    params: mapListParamsToQuery(params),
  });

  return {
    data: data.data.map(mapBrand),
    meta: mapPaginationMeta(data.meta),
  };
};

export const getBrand = async (id: number): Promise<Brand> => {
  const { data } = await catalogApi.get<ApiItemResponse<BrandDto>>(`${BRAND_ENDPOINT}/${id}`);
  return mapBrand(data.data);
};

export const createBrand = async (payload: BrandPayload): Promise<Brand> => {
  const { data } = await catalogApi.post<ApiItemResponse<BrandDto>>(
    BRAND_ENDPOINT,
    toApiPayload(payload),
  );
  return mapBrand(data.data);
};

export const updateBrand = async (id: number, payload: BrandPayload): Promise<Brand> => {
  const { data } = await catalogApi.put<ApiItemResponse<BrandDto>>(
    `${BRAND_ENDPOINT}/${id}`,
    toApiPayload(payload),
  );
  return mapBrand(data.data);
};

export const deleteBrand = async (id: number): Promise<void> => {
  await catalogApi.delete(`${BRAND_ENDPOINT}/${id}`);
};

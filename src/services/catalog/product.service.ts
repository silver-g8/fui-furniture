import type {
  ApiItemResponse,
  ApiListResponse,
  Brand,
  CategoryNode,
  ListParams,
  Product,
  ProductPayload,
  ProductStatus,
  StockMovement,
} from '@/types/catalog';
import { catalogApi, mapListParamsToQuery, mapPaginationMeta } from './api';
import { mapProductFieldsFromDto, mapProductFieldsToDto } from '@/utils/productMapper';

const PRODUCT_ENDPOINT = '/products';

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

interface CategoryDto {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  is_active: boolean;
  depth?: number;
  children?: CategoryDto[];
}

interface StockMovementDto {
  id: number;
  product_id: number;
  warehouse_id: number;
  quantity: number;
  type: string;
  balance_after: number;
  reason?: string | null;
  reference?: string | null;
  created_at: string;
}

interface ProductDto {
  id: number;
  sku: string;
  name: string;
  description?: string | null;
  status: ProductStatus;
  price: number;
  cost?: number | null;
  brand_id?: number | null;
  category_id?: number | null;
  on_hand: number;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
  brand?: BrandDto | null;
  category?: CategoryDto | null;
  stock_movements?: StockMovementDto[];
}

type PaginationMetaDto = Parameters<typeof mapPaginationMeta>[0];

interface ProductListResponseDto {
  data: ProductDto[];
  meta?: PaginationMetaDto;
  current_page?: number;
  per_page?: number;
  total?: number;
  last_page?: number;
}

type ProductItemPayload = ApiItemResponse<ProductDto> | ProductDto | null | undefined;

const isApiItemResponse = (payload: unknown): payload is ApiItemResponse<ProductDto> =>
  typeof payload === 'object' && payload !== null && 'data' in (payload as Record<string, unknown>);

const extractProductDto = (payload: ProductItemPayload): ProductDto | null => {
  if (!payload) {
    return null;
  }
  if (isApiItemResponse(payload)) {
    return payload.data;
  }
  if (typeof payload === 'object') {
    return payload;
  }
  return null;
};

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

const mapCategory = (dto: CategoryDto): CategoryNode => ({
  id: dto.id,
  name: dto.name,
  slug: dto.slug,
  parentId: dto.parent_id ?? null,
  isActive: dto.is_active,
  ...(dto.depth !== undefined ? { depth: dto.depth } : {}),
  children: Array.isArray(dto.children) ? dto.children.map(mapCategory) : [],
});

const mapStockMovement = (dto: StockMovementDto): StockMovement => ({
  id: dto.id,
  productId: dto.product_id,
  warehouseId: dto.warehouse_id,
  quantity: dto.quantity,
  type: dto.type as StockMovement['type'],
  balanceAfter: dto.balance_after,
  reason: dto.reason ?? null,
  reference: dto.reference ?? null,
  createdAt: dto.created_at,
});

const mapProduct = (dto: ProductDto | null): Product => {
  const { onHand, imageUrl } = mapProductFieldsFromDto(dto);
  const product: Product = {
    id: dto?.id ?? 0,
    sku: dto?.sku ?? '',
    name: dto?.name ?? '',
    description: dto?.description ?? null,
    status: dto?.status ?? 'draft',
    price: dto?.price ?? 0,
    cost: dto?.cost ?? null,
    brandId: dto?.brand_id ?? null,
    categoryId: dto?.category_id ?? null,
    onHand,
    imageUrl,
    brand: dto?.brand ? mapBrand(dto.brand) : null,
    category: dto?.category ? mapCategory(dto.category) : null,
    createdAt: dto?.created_at ?? new Date().toISOString(),
    updatedAt: dto?.updated_at ?? new Date().toISOString(),
  };

  const stockMovements = dto?.stock_movements?.map(mapStockMovement);
  if (stockMovements !== undefined) {
    product.stockMovements = stockMovements;
  }

  return product;
};

const toApiPayload = (payload: ProductPayload) => {
  const fields = mapProductFieldsToDto({
    onHand: payload.onHand,
    imageUrl: payload.imageUrl,
  });

  return {
    sku: payload.sku,
    name: payload.name,
    description: payload.description ?? null,
    status: payload.status,
    price: payload.price,
    cost: payload.cost ?? null,
    brand_id: payload.brandId ?? null,
    category_id: payload.categoryId ?? null,
    ...fields,
  };
};

const mapLegacyPaginationMeta = (payload: ProductListResponseDto): PaginationMetaDto => ({
  page: payload.current_page ?? 1,
  per_page: payload.per_page ?? (Array.isArray(payload.data) ? payload.data.length : 0),
  total: payload.total ?? (Array.isArray(payload.data) ? payload.data.length : 0),
  last_page: payload.last_page ?? 1,
});

export const fetchProducts = async (
  params: ListParams = {},
): Promise<ApiListResponse<Product>> => {
  const { data: payload } = await catalogApi.get<ProductListResponseDto>(PRODUCT_ENDPOINT, {
    params: mapListParamsToQuery(params),
  });

  const paginationMeta =
    payload.meta !== undefined && payload.meta !== null
      ? payload.meta
      : mapLegacyPaginationMeta(payload);

  return {
    data: payload.data.map(mapProduct),
    meta: mapPaginationMeta(paginationMeta),
  };
};

export const getProduct = async (id: number): Promise<Product> => {
  const { data } = await catalogApi.get<ProductItemPayload>(`${PRODUCT_ENDPOINT}/${id}`);
  return mapProduct(extractProductDto(data));
};

export const createProduct = async (payload: ProductPayload): Promise<Product> => {
  const { data } = await catalogApi.post<ProductItemPayload>(
    PRODUCT_ENDPOINT,
    toApiPayload(payload),
  );
  return mapProduct(extractProductDto(data));
};

export const updateProduct = async (id: number, payload: ProductPayload): Promise<Product> => {
  const { data } = await catalogApi.put<ProductItemPayload>(
    `${PRODUCT_ENDPOINT}/${id}`,
    toApiPayload(payload),
  );
  return mapProduct(extractProductDto(data));
};

export const deleteProduct = async (id: number): Promise<void> => {
  await catalogApi.delete(`${PRODUCT_ENDPOINT}/${id}`);
};

/**
 * Upload an image file for a product.
 *
 * @param id - Product ID
 * @param file - Image file to upload (JPEG, PNG, or WebP, max 2MB)
 * @returns Updated product with image_url
 */
export const uploadProductImage = async (id: number, file: File): Promise<Product> => {
  const formData = new FormData();
  formData.append('image', file);

  await catalogApi.post<ProductItemPayload>(
    `${PRODUCT_ENDPOINT}/${id}/image`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  // The API returns { image_url: string }, so we need to fetch the updated product
  const updatedProduct = await getProduct(id);
  return updatedProduct;
};

/**
 * Delete the image for a product.
 *
 * @param id - Product ID
 * @returns Promise that resolves when deletion is complete
 */
export const deleteProductImage = async (id: number): Promise<void> => {
  await catalogApi.delete(`${PRODUCT_ENDPOINT}/${id}/image`);
};
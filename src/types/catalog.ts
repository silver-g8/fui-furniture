export type ProductStatus = 'draft' | 'active' | 'inactive' | 'archived';

export interface Brand {
  id: number;
  name: string;
  slug: string;
  code: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
  isActive: boolean;
  depth?: number;
  children: CategoryNode[];
}

export type StockMovementType = 'adjust_in' | 'adjust_out' | (string & Record<never, never>);

export interface StockMovement {
  id: number;
  productId: number;
  warehouseId: number;
  quantity: number;
  type: StockMovementType;
  balanceAfter: number;
  reason?: string | null;
  reference?: string | null;
  createdAt: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string | null;
  status: ProductStatus;
  price: number;
  cost?: number | null;
  brandId?: number | null;
  categoryId?: number | null;
  onHand: number;
  imageUrl: string | null;
  brand?: Brand | null;
  category?: CategoryNode | null;
  createdAt: string;
  updatedAt: string;
  stockMovements?: StockMovement[];
}

export interface ProductPayload {
  sku: string;
  name: string;
  status: ProductStatus;
  price: number;
  onHand: number;
  description?: string | null;
  cost?: number | null;
  brandId?: number | null;
  categoryId?: number | null;
  imageUrl: string | null;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
}

export type SortDirection = 'asc' | 'desc';

export interface ListParams {
  search?: string;
  categoryId?: number | null;
  brandId?: number | null;
  status?: ProductStatus | null;
  isActive?: boolean;
  page?: number;
  perPage?: number;
  sort?: string | null;
  order?: SortDirection | null;
}

export interface StockAdjustPayload {
  productId: number;
  warehouseId: number;
  quantity: number;
  type: 'adjust_in' | 'adjust_out';
  reason: string;
  reference?: string | null;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiItemResponse<T> {
  data: T;
}

export interface CategoryCreatePayload {
  name: string;
  slug?: string;
  parent_id?: number | null;
  is_active: boolean;
  description?: string;
}

export interface CategoryUpdatePayload {
  name?: string;
  slug?: string;
  parent_id?: number | null;
  is_active?: boolean;
  description?: string;
}


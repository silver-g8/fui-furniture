import type { StockAdjustPayload, ApiListResponse, StockMovement, PaginationMeta } from '@/types/catalog';
import { catalogApi, mapPaginationMeta } from './api';

const STOCK_ENDPOINT = '/api/stock-movements/adjust';
const STOCK_MOVEMENTS_ENDPOINT = '/stock-movements';

interface StockAdjustResponseDto {
  data: {
    movement_id: number;
    balance_after: number;
    trace_id?: string;
  };
}

export interface StockAdjustResult {
  movementId: number;
  balanceAfter: number;
  traceId?: string;
}

export const adjustStock = async (payload: StockAdjustPayload): Promise<StockAdjustResult> => {
  const { data } = await catalogApi.post<StockAdjustResponseDto>(STOCK_ENDPOINT, {
    product_id: payload.productId,
    warehouse_id: payload.warehouseId,
    quantity: payload.quantity,
    type: payload.type,
    reason: payload.reason,
    reference: payload.reference ?? undefined,
  });

  const traceId = data.data.trace_id;
  return {
    movementId: data.data.movement_id,
    balanceAfter: data.data.balance_after,
    ...(traceId !== undefined ? { traceId } : {}),
  };
};

interface StockMovementDto {
  id: number;
  product_id: number;
  warehouse_id: number;
  warehouse_name?: string | null;
  quantity: number;
  type: string;
  balance_after: number | null;
  reason?: string | null;
  reference?: string | null;
  reference_type?: string | null;
  reference_id?: number | null;
  created_at: string;
}

interface StockMovementListResponseDto {
  data: StockMovementDto[];
  meta?: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  current_page?: number;
  per_page?: number;
  total?: number;
  last_page?: number;
}

interface StockMovementListParams {
  productId?: number;
  warehouseId?: number;
  type?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

const mapStockMovement = (dto: StockMovementDto): StockMovement => {
  const movement: StockMovement = {
    id: dto.id,
    productId: dto.product_id,
    warehouseId: dto.warehouse_id,
    quantity: dto.quantity,
    type: dto.type as StockMovement['type'],
    balanceAfter: dto.balance_after ?? null,
    reason: dto.reason ?? null,
    reference: dto.reference ?? null,
    referenceType: dto.reference_type ?? null,
    referenceId: dto.reference_id ?? null,
    createdAt: dto.created_at,
  };
  if (dto.warehouse_name !== null && dto.warehouse_name !== undefined) {
    movement.warehouseName = dto.warehouse_name;
  }
  return movement;
};

const mapListParamsToQuery = (params: StockMovementListParams) => {
  const query: Record<string, string | number> = {};

  if (params.productId !== undefined) {
    query.product_id = params.productId;
  }
  if (params.warehouseId !== undefined) {
    query.warehouse_id = params.warehouseId;
  }
  if (params.type) {
    query.type = params.type;
  }
  if (params.fromDate) {
    query.from_date = params.fromDate;
  }
  if (params.toDate) {
    query.to_date = params.toDate;
  }
  if (params.search) {
    query.search = params.search;
  }
  if (params.page !== undefined) {
    query.page = params.page;
  }
  if (params.perPage !== undefined) {
    query.per_page = params.perPage;
  }

  return query;
};

const mapPaginationMetaFromResponse = (payload: StockMovementListResponseDto): PaginationMeta => {
  if (payload.meta) {
    return mapPaginationMeta(payload.meta);
  }
  return {
    page: payload.current_page ?? 1,
    perPage: payload.per_page ?? payload.data.length,
    total: payload.total ?? payload.data.length,
    lastPage: payload.last_page ?? 1,
  };
};

/**
 * Fetch stock movements list with filters.
 *
 * @param params - Filter parameters
 * @returns Promise that resolves to stock movements list with pagination
 */
export const fetchStockMovements = async (
  params: StockMovementListParams = {},
): Promise<ApiListResponse<StockMovement>> => {
  const { data: payload } = await catalogApi.get<StockMovementListResponseDto>(
    STOCK_MOVEMENTS_ENDPOINT,
    {
      params: mapListParamsToQuery(params),
    },
  );

  return {
    data: payload.data.map(mapStockMovement),
    meta: mapPaginationMetaFromResponse(payload),
  };
};

/**
 * Get stock movements for a specific product.
 *
 * @param productId - Product ID
 * @param params - Optional additional filters
 * @returns Promise that resolves to stock movements list with pagination
 */
export const getProductStockMovements = async (
  productId: number,
  params: Omit<StockMovementListParams, 'productId'> = {},
): Promise<ApiListResponse<StockMovement>> => {
  return fetchStockMovements({ ...params, productId });
};

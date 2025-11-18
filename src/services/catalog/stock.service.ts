import type { StockAdjustPayload, ApiListResponse, StockMovement, PaginationMeta } from '@/types/catalog';
import { catalogApi, mapPaginationMeta } from './api';

const STOCK_ENDPOINT_IN = '/stocks/in';
const STOCK_ENDPOINT_OUT = '/stocks/out';
const STOCK_MOVEMENTS_ENDPOINT = '/stock-movements';

interface StockAdjustResponseDto {
  data: {
    id: number;
    warehouse_id: number;
    product_id: number;
    quantity: number;
  };
  message: string;
}

export interface StockAdjustResult {
  movementId: number;
  balanceAfter: number;
  traceId?: string;
}

export const adjustStock = async (payload: StockAdjustPayload): Promise<StockAdjustResult> => {
  // Use /stocks/in for adjust_in and /stocks/out for adjust_out
  const endpoint = payload.type === 'adjust_in' ? STOCK_ENDPOINT_IN : STOCK_ENDPOINT_OUT;
  
  const { data } = await catalogApi.post<StockAdjustResponseDto>(endpoint, {
    product_id: payload.productId,
    warehouse_id: payload.warehouseId,
    quantity: payload.quantity,
    reason: payload.reason || null,
    reference: payload.reference || null,
  });

  // Get the stock movement ID from the response or fetch it
  // For now, we'll use the stock ID as movement ID
  return {
    movementId: data.data.id,
    balanceAfter: data.data.quantity,
  };
};

interface StockMovementDto {
  id: number;
  product_id?: number;
  warehouse_id?: number;
  warehouse_name?: string | null;
  quantity: number;
  type: string;
  balance_after?: number | null;
  reason?: string | null;
  reference?: string | null;
  reference_type?: string | null;
  reference_id?: number | null;
  created_at: string;
  stock?: {
    product?: {
      id?: number;
    };
    warehouse?: {
      id?: number;
      name?: string;
    };
  };
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
  soId?: number; // Sales Order ID
  page?: number;
  perPage?: number;
}

const mapStockMovement = (dto: StockMovementDto): StockMovement => {
  const movement: StockMovement = {
    id: dto.id,
    productId: dto.product_id ?? dto.stock?.product?.id ?? 0,
    warehouseId: dto.warehouse_id ?? dto.stock?.warehouse?.id ?? 0,
    quantity: dto.quantity,
    type: dto.type as StockMovement['type'],
    balanceAfter: dto.balance_after ?? null,
    reason: dto.reason ?? null,
    reference: dto.reference ?? null,
    referenceType: dto.reference_type ?? null,
    referenceId: dto.reference_id ?? null,
    createdAt: dto.created_at,
  };
  // Map warehouse_name from response or from stock.warehouse.name
  if (dto.warehouse_name !== null && dto.warehouse_name !== undefined) {
    movement.warehouseName = dto.warehouse_name;
  } else if (dto.stock?.warehouse?.name) {
    movement.warehouseName = dto.stock.warehouse.name;
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
  if (params.soId !== undefined) {
    query.so_id = params.soId;
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

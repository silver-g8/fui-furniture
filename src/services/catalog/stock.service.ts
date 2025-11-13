import type { StockAdjustPayload } from '@/types/catalog';
import { catalogApi } from './api';

const STOCK_ENDPOINT = '/api/stock-movements/adjust';

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

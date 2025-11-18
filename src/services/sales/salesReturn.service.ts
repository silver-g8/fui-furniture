import { salesApi } from './api';
import type { Product } from '@/types/catalog';
import type { PaginatedResponse } from './api';

export interface SalesReturnItem {
  id?: number;
  sales_return_id?: number;
  product_id: number;
  quantity: number;
  price: number;
  remark?: string | null;
  product?: Product;
}

export interface SalesReturn {
  id: number;
  sales_order_id?: number | null;
  order_id?: number | null;
  warehouse_id: number;
  returned_at?: string | null;
  reason?: string | null;
  status: 'draft' | 'approved';
  total: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  warehouse?: {
    id: number;
    code: string;
    name: string;
  };
  items?: SalesReturnItem[];
  sales_order?: {
    id: number;
    sales_order_no: string;
  };
  order?: {
    id: number;
    order_no: string;
  };
}

export interface SalesReturnPayload {
  sales_order_id?: number | null;
  order_id?: number | null;
  warehouse_id: number;
  reason?: string | null;
  notes?: string | null;
  items: Array<{
    product_id: number;
    quantity: number;
    price: number;
    remark?: string | null;
  }>;
}

export interface SalesReturnListParams {
  sales_order_id?: number;
  order_id?: number;
  warehouse_id?: number;
  status?: 'draft' | 'approved';
  search?: string;
  page?: number;
  per_page?: number;
}

export const listSalesReturns = async (
  params: SalesReturnListParams = {},
): Promise<PaginatedResponse<SalesReturn>> => {
  const response = await salesApi.get<PaginatedResponse<SalesReturn>>('/returns/sales', {
    params,
  });
  return response.data;
};

export const getSalesReturn = async (id: number): Promise<SalesReturn> => {
  const response = await salesApi.get<SalesReturn>(`/returns/sales/${id}`);
  return response.data;
};

export const createSalesReturn = async (payload: SalesReturnPayload): Promise<SalesReturn> => {
  const response = await salesApi.post<SalesReturn>('/returns/sales', payload);
  return response.data;
};

export const approveSalesReturn = async (id: number): Promise<SalesReturn> => {
  const response = await salesApi.post<SalesReturn>(`/returns/sales/${id}/approve`);
  return response.data;
};

export const deleteSalesReturn = async (id: number): Promise<void> => {
  await salesApi.delete(`/returns/sales/${id}`);
};


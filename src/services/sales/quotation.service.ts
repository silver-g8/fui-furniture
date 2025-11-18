import { salesApi } from './api';
import type {
  Quotation,
  QuotationPayload,
  QuotationListParams,
  SalesOrder,
} from '@/types/sales';
import type { PaginatedResponse } from './api';

export const listQuotations = async (
  params: QuotationListParams = {},
): Promise<PaginatedResponse<Quotation>> => {
  const response = await salesApi.get<PaginatedResponse<Quotation>>('/quotations', {
    params,
  });
  return response.data;
};

export const getQuotation = async (id: number): Promise<Quotation> => {
  const response = await salesApi.get<Quotation>(`/quotations/${id}`);
  return response.data;
};

export const createQuotation = async (
  payload: QuotationPayload,
): Promise<Quotation> => {
  const response = await salesApi.post<Quotation>('/quotations', payload);
  return response.data;
};

export const updateQuotation = async (
  id: number,
  payload: Partial<QuotationPayload>,
): Promise<Quotation> => {
  const response = await salesApi.put<Quotation>(`/quotations/${id}`, payload);
  return response.data;
};

export const deleteQuotation = async (id: number): Promise<void> => {
  await salesApi.delete(`/quotations/${id}`);
};

export const approveQuotation = async (id: number): Promise<Quotation> => {
  const response = await salesApi.patch<Quotation>(`/quotations/${id}/approve`);
  return response.data;
};

export const rejectQuotation = async (
  id: number,
  reason: string,
): Promise<Quotation> => {
  const response = await salesApi.patch<Quotation>(`/quotations/${id}/reject`, {
    reason,
  });
  return response.data;
};

export const createSalesOrderFromQuotation = async (
  id: number,
): Promise<SalesOrder> => {
  const response = await salesApi.post<SalesOrder>(
    `/quotations/${id}/create-sales-order`,
  );
  return response.data;
};

export interface AuditLog {
  id: number;
  action: string;
  user_id?: number | null;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
  created_at: string;
}

export const getQuotationAuditLogs = async (id: number): Promise<{ data: AuditLog[] }> => {
  const response = await salesApi.get<{ data: AuditLog[] }>(`/quotations/${id}/audit-logs`);
  return response.data;
};


import { api } from 'boot/axios';
import type { AxiosInstance } from 'axios';

export const apApi: AxiosInstance = api;

// ========================================
// AP Invoice Types
// ========================================

export interface ApInvoice {
  id: number;
  supplier_id: number;
  purchase_id?: number | null;
  invoice_no: string;
  invoice_date: string;
  due_date?: string | null;
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  grand_total: number;
  paid_total: number;
  open_amount: number;
  currency: string;
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'cancelled';
  reference_type?: string | null;
  reference_id?: number | null;
  note?: string | null;
  issued_at?: string | null;
  cancelled_at?: string | null;
  is_overdue?: boolean;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: number;
    code: string;
    name: string;
  };
  purchase?: {
    id: number;
    grand_total: number;
  };
}

export interface ApInvoiceListParams {
  supplier_id?: number;
  purchase_id?: number;
  status?: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'cancelled';
  from_date?: string;
  to_date?: string;
  overdue?: boolean;
  unpaid?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface ApInvoicePayload {
  supplier_id: number;
  purchase_id?: number | null;
  invoice_no: string;
  invoice_date: string;
  due_date?: string | null;
  subtotal_amount: number;
  discount_amount?: number;
  tax_amount?: number;
  currency?: string;
  reference_type?: string | null;
  reference_id?: number | null;
  note?: string | null;
}

// ========================================
// AP Payment Types
// ========================================

export interface ApPayment {
  id: number;
  supplier_id: number;
  payment_no: string;
  payment_date: string;
  total_amount: number;
  payment_method?: string | null;
  reference?: string | null;
  reference_no?: string | null;
  status: 'draft' | 'posted' | 'cancelled';
  note?: string | null;
  posted_at?: string | null;
  cancelled_at?: string | null;
  total_allocated?: number;
  unallocated_amount?: number;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: number;
    code: string;
    name: string;
  };
  allocations?: ApPaymentAllocation[];
}

export interface ApPaymentAllocation {
  id: number;
  payment_id: number;
  invoice_id: number;
  allocated_amount: number;
  created_at: string;
  updated_at: string;
  invoice?: ApInvoice;
}

export interface ApPaymentListParams {
  supplier_id?: number;
  status?: 'draft' | 'posted' | 'cancelled';
  from_date?: string;
  to_date?: string;
  payment_method?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface ApPaymentPayload {
  supplier_id: number;
  payment_no?: string;
  payment_date: string;
  total_amount: number;
  payment_method?: string | null;
  reference?: string | null;
  reference_no?: string | null;
  note?: string | null;
  allocations?: {
    invoice_id: number;
    allocated_amount: number;
  }[];
}

// ========================================
// Common Types
// ========================================

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface AgingReport {
  current: number;
  '1_30': number;
  '31_60': number;
  '61_90': number;
  over_90: number;
}

export interface SupplierPaymentSummary {
  total_paid: number;
  total_outstanding: number;
  overdue_amount: number;
}

// ========================================
// AP Invoice API Functions
// ========================================

export const listApInvoices = async (
  params: ApInvoiceListParams = {},
): Promise<PaginatedResponse<ApInvoice>> => {
  const response = await apApi.get<PaginatedResponse<ApInvoice>>('/ap/invoices', {
    params,
  });
  return response.data;
};

export const getApInvoice = async (id: number): Promise<ApInvoice> => {
  const response = await apApi.get<ApiResponse<ApInvoice>>(`/ap/invoices/${id}`);
  return response.data.data;
};

export const createApInvoice = async (payload: ApInvoicePayload): Promise<ApInvoice> => {
  const response = await apApi.post<ApiResponse<ApInvoice>>('/ap/invoices', payload);
  return response.data.data;
};

export const updateApInvoice = async (
  id: number,
  payload: Partial<ApInvoicePayload>,
): Promise<ApInvoice> => {
  const response = await apApi.put<ApiResponse<ApInvoice>>(`/ap/invoices/${id}`, payload);
  return response.data.data;
};

export const issueApInvoice = async (id: number): Promise<ApInvoice> => {
  const response = await apApi.post<ApiResponse<ApInvoice>>(`/ap/invoices/${id}/issue`);
  return response.data.data;
};

export const cancelApInvoice = async (id: number): Promise<ApInvoice> => {
  const response = await apApi.post<ApiResponse<ApInvoice>>(`/ap/invoices/${id}/cancel`);
  return response.data.data;
};

export const getAgingReport = async (supplierId: number): Promise<AgingReport> => {
  const response = await apApi.get<ApiResponse<AgingReport>>('/ap/invoices/aging/report', {
    params: { supplier_id: supplierId },
  });
  return response.data.data;
};

// ========================================
// AP Payment API Functions
// ========================================

export const listApPayments = async (
  params: ApPaymentListParams = {},
): Promise<PaginatedResponse<ApPayment>> => {
  const response = await apApi.get<PaginatedResponse<ApPayment>>('/ap/payments', {
    params,
  });
  return response.data;
};

export const getApPayment = async (id: number): Promise<ApPayment> => {
  const response = await apApi.get<ApiResponse<ApPayment>>(`/ap/payments/${id}`);
  return response.data.data;
};

export const createApPayment = async (payload: ApPaymentPayload): Promise<ApPayment> => {
  const response = await apApi.post<ApiResponse<ApPayment>>('/ap/payments', payload);
  return response.data.data;
};

export const updateApPayment = async (
  id: number,
  payload: Partial<ApPaymentPayload>,
): Promise<ApPayment> => {
  const response = await apApi.put<ApiResponse<ApPayment>>(`/ap/payments/${id}`, payload);
  return response.data.data;
};

export const postApPayment = async (id: number): Promise<ApPayment> => {
  const response = await apApi.post<ApiResponse<ApPayment>>(`/ap/payments/${id}/post`);
  return response.data.data;
};

export const cancelApPayment = async (id: number): Promise<ApPayment> => {
  const response = await apApi.post<ApiResponse<ApPayment>>(`/ap/payments/${id}/cancel`);
  return response.data.data;
};

export const autoAllocatePayment = async (id: number): Promise<ApPayment> => {
  const response = await apApi.post<ApiResponse<ApPayment>>(`/ap/payments/${id}/auto-allocate`);
  return response.data.data;
};

export const getSupplierPaymentSummary = async (
  supplierId: number,
): Promise<SupplierPaymentSummary> => {
  const response = await apApi.get<ApiResponse<SupplierPaymentSummary>>(
    '/ap/payments/supplier/summary',
    {
      params: { supplier_id: supplierId },
    },
  );
  return response.data.data;
};

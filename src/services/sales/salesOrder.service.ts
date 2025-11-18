import { salesApi } from './api';
import type {
  SalesOrder,
  SalesOrderPayload,
  SalesOrderListParams,
  PaymentStatus,
} from '@/types/sales';
import type { Customer } from './api';
import type { Product } from '@/types/catalog';
import type { PaginatedResponse } from './api';

export const listSalesOrders = async (
  params: SalesOrderListParams = {},
): Promise<PaginatedResponse<SalesOrder>> => {
  const response = await salesApi.get<PaginatedResponse<SalesOrder>>('/sales-orders', {
    params,
  });
  return response.data;
};

export const getSalesOrder = async (id: number): Promise<SalesOrder> => {
  const response = await salesApi.get<SalesOrder>(`/sales-orders/${id}`);
  return response.data;
};

export const createSalesOrder = async (
  payload: SalesOrderPayload,
): Promise<SalesOrder> => {
  const response = await salesApi.post<SalesOrder>('/sales-orders', payload);
  return response.data;
};

export const updateSalesOrder = async (
  id: number,
  payload: Partial<SalesOrderPayload>,
): Promise<SalesOrder> => {
  const response = await salesApi.put<SalesOrder>(`/sales-orders/${id}`, payload);
  return response.data;
};

export const deleteSalesOrder = async (id: number): Promise<void> => {
  await salesApi.delete(`/sales-orders/${id}`);
};

export const confirmSalesOrder = async (id: number): Promise<SalesOrder> => {
  const response = await salesApi.post<SalesOrder>(`/sales-orders/${id}/confirm`);
  return response.data;
};

export const reserveSalesOrder = async (id: number): Promise<SalesOrder> => {
  const response = await salesApi.post<SalesOrder>(`/sales-orders/${id}/reserve`);
  return response.data;
};

export const deliverSalesOrder = async (id: number): Promise<SalesOrder> => {
  const response = await salesApi.post<SalesOrder>(`/sales-orders/${id}/deliver`);
  return response.data;
};

export const cancelSalesOrder = async (id: number): Promise<SalesOrder> => {
  const response = await salesApi.post<SalesOrder>(`/sales-orders/${id}/cancel`);
  return response.data;
};

export interface PartialDeliveryItem {
  id: number;
  qty: number;
}

export interface PartialDeliveryPayload {
  deliveries: PartialDeliveryItem[];
}

export const partialDeliverSalesOrder = async (
  id: number,
  payload: PartialDeliveryPayload,
): Promise<SalesOrder> => {
  const response = await salesApi.post<SalesOrder>(`/sales-orders/${id}/partial-deliver`, payload);
  return response.data;
};

export interface InstallationRequestPayload {
  installation_date: string;
  installation_address_id?: number | null;
  installation_address_override?: string | null;
  installation_contact_name?: string | null;
  installation_contact_phone?: string | null;
  notes?: string | null;
}

export interface InstallationOrder {
  id: number;
  sales_order_id: number;
  customer_id: number;
  installation_address_id?: number | null;
  installation_address_override?: string | null;
  installation_contact_name?: string | null;
  installation_contact_phone?: string | null;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  sales_order?: SalesOrder;
  customer?: {
    id: number;
    name: string;
  };
  installation_address?: {
    id: number;
    address: string;
  };
}

export const requestInstallation = async (
  salesOrderId: number,
  payload: InstallationRequestPayload,
): Promise<InstallationOrder> => {
  const response = await salesApi.post<InstallationOrder>(
    `/sales-orders/${salesOrderId}/request-installation`,
    payload,
  );
  return response.data;
};

export interface InvoiceCreatePayload {
  invoice_date?: string;
  due_date?: string;
  payment_term_id?: number | null;
  discount_amount?: number;
  tax_amount?: number;
  notes?: string | null;
  allow_multiple?: boolean;
}

export interface Invoice {
  id: number;
  customer_id: number;
  sales_order_id: number;
  invoice_no: string;
  invoice_date: string;
  due_date?: string | null;
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  grand_total: number;
  paid_total: number;
  open_amount: number;
  status: string;
  payment_term_id?: number | null;
  note?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  sales_order?: SalesOrder;
  items?: Array<{
    id: number;
    invoice_id: number;
    product_id: number;
    description: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    tax_amount: number;
    line_total: number;
    product?: Product;
  }>;
}

export const createInvoiceFromSalesOrder = async (
  salesOrderId: number,
  payload: InvoiceCreatePayload,
): Promise<Invoice> => {
  const response = await salesApi.post<Invoice>(
    `/sales-orders/${salesOrderId}/create-invoice`,
    payload,
  );
  return response.data;
};

export const getPaymentStatus = async (
  salesOrderId: number,
): Promise<PaymentStatus> => {
  const response = await salesApi.get<PaymentStatus>(
    `/sales-orders/${salesOrderId}/payment-status`,
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

export const getSalesOrderAuditLogs = async (
  id: number,
): Promise<{ data: AuditLog[] }> => {
  const response = await salesApi.get<{ data: AuditLog[] }>(`/sales-orders/${id}/audit-logs`);
  return response.data;
};


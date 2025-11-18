import { salesApi } from './api';
import type { SalesOrder, SalesOrderPayload } from '@/types/sales';
import type { Invoice } from './salesOrder.service';

export interface Receipt {
  id: number;
  customer_id: number;
  receipt_no: string;
  receipt_date: string;
  total_amount: number;
  paid_total: number;
  payment_method: string;
  reference_no?: string | null;
  note?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: number;
    name: string;
  };
  allocations?: Array<{
    id: number;
    receipt_id: number;
    invoice_id: number;
    allocated_amount: number;
    invoice?: Invoice;
  }>;
}

export interface CashSalePayload extends SalesOrderPayload {
  // Invoice fields
  invoice_date?: string;
  due_date?: string;
  payment_term_id?: number | null;
  discount_amount?: number;
  tax_amount?: number;
  
  // Receipt fields
  receipt_date?: string;
  payment_method?: 'cash' | 'bank_transfer' | 'cheque' | 'credit_card' | 'promissory_note';
  reference_no?: string | null;
  receipt_note?: string | null;
}

export interface CashSaleResponse {
  message: string;
  sales_order: SalesOrder;
  invoice: Invoice;
  receipt: Receipt | null; // null if pending payment
  is_pending_payment?: boolean; // true if payment is not cash
}

export const processCashSale = async (
  payload: CashSalePayload,
): Promise<CashSaleResponse> => {
  const response = await salesApi.post<CashSaleResponse>('/sales-orders/cash-sale', payload);
  return response.data;
};


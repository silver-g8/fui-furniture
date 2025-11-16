/**
 * AR System - Invoice Types
 * ไฟล์รวม types สำหรับใบแจ้งหนี้ (AR Invoices)
 */

import type {
  CustomerRef,
  InvoiceStatus,
  BaseQueryParams,
  DateRange,
  PaginatedResponse,
} from './common';

// ==================== Invoice Line Item ====================
export interface InvoiceLineItem {
  id?: number;
  invoice_id?: number;
  product_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  line_total: number;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceLineItemPayload {
  product_id?: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  tax_amount?: number;
  note?: string | null;
}

// ==================== Invoice ====================
export interface Invoice {
  id: number;
  customer: CustomerRef;
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  payment_term_id: number | null;
  payment_term?: {
    id: number;
    code: string;
    name: string;
  } | null;

  // Amounts
  subtotal_amount: string;
  discount_amount: string;
  tax_amount: string;
  grand_total: string;
  paid_total: string;
  open_amount: string;

  // Status
  status: InvoiceStatus;
  status_label?: string;

  // Dates
  issued_at: string | null;
  cancelled_at: string | null;

  // Line items
  items?: InvoiceLineItem[];

  // Relations count
  receipts_count?: number;
  credit_notes_count?: number;

  // Metadata
  note: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== Invoice Payload ====================
export interface InvoicePayload {
  customer_id: number;
  invoice_date: string;
  due_date: string;
  payment_term_id?: number | null;
  items: InvoiceLineItemPayload[];
  discount_amount?: number;
  tax_amount?: number;
  note?: string | null;
}

export type UpdateInvoicePayload = Partial<InvoicePayload>;

// ==================== Invoice Query Params ====================
export interface InvoiceQueryParams extends BaseQueryParams, DateRange {
  customer_id?: number;
  status?: InvoiceStatus | InvoiceStatus[];
  invoice_no?: string;
  overdue_only?: boolean;
  has_balance?: boolean; // open_amount > 0
  date_from?: string;
  date_to?: string;
}

// ==================== Invoice List Response ====================
export type InvoiceListResponse = PaginatedResponse<Invoice>;

// ==================== Invoice Summary ====================
export interface InvoiceSummary {
  total_invoices: number;
  total_amount: string;
  total_paid: string;
  total_outstanding: string;
  by_status: {
    draft: number;
    issued: number;
    partially_paid: number;
    paid: number;
    overdue: number;
    cancelled: number;
  };
}

// ==================== Invoice Helpers ====================
export const calculateLineTotal = (item: InvoiceLineItemPayload): number => {
  const subtotal = item.quantity * item.unit_price;
  const discount = item.discount_amount || 0;
  const tax = item.tax_amount || 0;
  return subtotal - discount + tax;
};

export const calculateInvoiceSubtotal = (items: InvoiceLineItemPayload[]): number => {
  return items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
};

export const isInvoiceOverdue = (invoice: Invoice): boolean => {
  if (invoice.status === 'paid' || invoice.status === 'cancelled') {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(invoice.due_date);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
};

export const getDaysOverdue = (invoice: Invoice): number => {
  if (!isInvoiceOverdue(invoice)) {
    return 0;
  }
  const today = new Date();
  const dueDate = new Date(invoice.due_date);
  const diffTime = today.getTime() - dueDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const canIssueInvoice = (invoice: Invoice): boolean => {
  return invoice.status === 'draft';
};

export const canCancelInvoice = (invoice: Invoice): boolean => {
  return invoice.status === 'draft' || invoice.status === 'issued';
};

export const canEditInvoice = (invoice: Invoice): boolean => {
  return invoice.status === 'draft';
};

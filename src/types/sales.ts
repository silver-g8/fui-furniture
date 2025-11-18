import type { Customer } from '@/services/sales/api';
import type { Product } from '@/types/catalog';

export type QuotationStatus = 'draft' | 'waiting' | 'approved' | 'rejected';

export type SalesOrderStatus =
  | 'draft'
  | 'confirmed'
  | 'reserved'
  | 'picking'
  | 'shipping'
  | 'partially_delivered'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type InvoiceStatus = 'not_invoiced' | 'invoiced' | 'partially_paid' | 'paid';

export interface QuotationItem {
  id?: number;
  quotation_id?: number;
  product_id: number;
  qty: number;
  price: number;
  discount?: number;
  total?: number;
  notes?: string | null;
  warehouse_id?: number | null;
  product?: Product;
  warehouse?: {
    id: number;
    code: string;
    name: string;
  } | null;
}

export interface Quotation {
  id: number;
  customer_id: number;
  quotation_no: string;
  quotation_date: string;
  expiry_date?: string | null;
  status: QuotationStatus;
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  notes?: string | null;
  approved_by?: number | null;
  approved_at?: string | null;
  rejected_by?: number | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  items?: QuotationItem[];
  approver?: {
    id: number;
    name: string;
  } | null;
  rejector?: {
    id: number;
    name: string;
  } | null;
  sales_order?: SalesOrder[];
}

export interface SalesOrderItem {
  id?: number;
  sales_order_id?: number;
  product_id: number;
  warehouse_id?: number | null;
  qty: number;
  delivered_qty?: number;
  backorder_qty?: number;
  price: number;
  discount?: number;
  total?: number;
  product?: Product;
  warehouse?: {
    id: number;
    code: string;
    name: string;
  } | null;
}

export interface SalesOrder {
  id: number;
  customer_id: number;
  quotation_id?: number | null;
  sales_order_no: string;
  status: SalesOrderStatus;
  invoice_status?: InvoiceStatus;
  payment_term?: string | null;
  warehouse_id?: number | null;
  delivery_date?: string | null;
  reference?: string | null;
  total_amount: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  quotation?: Quotation | null;
  warehouse?: {
    id: number;
    code: string;
    name: string;
  } | null;
  items?: SalesOrderItem[];
  installation_orders?: Array<{
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
    installation_address?: {
      id: number;
      address: string;
    };
  }>;
  invoices?: Array<{
    id: number;
    invoice_no: string;
    invoice_date: string;
    due_date?: string | null;
    grand_total: number;
    paid_total?: number;
    open_amount: number;
    status: string;
  }>;
  sales_returns?: Array<{
    id: number;
    sales_order_id: number;
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
    items?: Array<{
      id: number;
      sales_return_id: number;
      product_id: number;
      quantity: number;
      price: number;
      remark?: string | null;
      product?: Product;
    }>;
  }>;
}

export interface PaymentStatus {
  invoice_status: InvoiceStatus;
  total_invoice_amount: number;
  total_paid_amount: number;
  total_outstanding_amount: number;
  invoices: Array<{
    id: number;
    invoice_no: string;
    invoice_date: string;
    due_date?: string | null;
    grand_total: number;
    paid_total: number;
    open_amount: number;
    status: string;
  }>;
}

export interface QuotationPayload {
  customer_id: number;
  quotation_no?: string;
  quotation_date: string;
  expiry_date?: string | null;
  subtotal?: number;
  discount?: number;
  tax?: number;
  grand_total?: number;
  notes?: string | null;
  status?: QuotationStatus;
  items: Omit<QuotationItem, 'id' | 'quotation_id' | 'product'>[];
}

export interface SalesOrderPayload {
  customer_id: number | null;
  quotation_id?: number | null;
  sales_order_no?: string;
  status?: SalesOrderStatus;
  payment_term?: string | null;
  warehouse_id?: number | null;
  delivery_date?: string | null;
  reference?: string | null;
  total_amount?: number;
  notes?: string | null;
  items: Omit<SalesOrderItem, 'id' | 'sales_order_id' | 'product'>[];
}

export interface QuotationListParams {
  status?: QuotationStatus;
  customer_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface SalesOrderListParams {
  status?: SalesOrderStatus;
  customer_id?: number;
  quotation_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}


/**
 * AR System - Receipt Types
 * ไฟล์รวม types สำหรับใบเสร็จรับเงิน (AR Receipts)
 */

import type {
  CustomerRef,
  ReceiptStatus,
  PaymentMethod,
  BaseQueryParams,
  DateRange,
  PaginatedResponse,
} from './common';

// ==================== Receipt Allocation ====================
export interface ReceiptAllocation {
  id?: number;
  receipt_id?: number;
  invoice_id: number;
  invoice?: {
    id: number;
    invoice_no: string;
    invoice_date: string;
    due_date: string;
    open_amount: string;
    grand_total: string;
  };
  allocated_amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface ReceiptAllocationPayload {
  invoice_id: number;
  amount: number;
}

// ==================== Receipt ====================
export interface Receipt {
  id: number;
  customer: CustomerRef;
  receipt_no: string;
  receipt_date: string;
  amount: string;

  // Payment details
  payment_method: PaymentMethod;
  payment_method_label?: string;
  bank_account: string | null;
  cheque_no: string | null;
  cheque_date: string | null;
  reference_no: string | null;

  // Status
  status: ReceiptStatus;
  status_label?: string;

  // Dates
  posted_at: string | null;
  cancelled_at: string | null;

  // Relations
  allocations?: ReceiptAllocation[];
  allocated_total?: string;
  unallocated_amount?: string;

  // GL Entry
  gl_entry_id: number | null;

  // Metadata
  note: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== Receipt Payload ====================
export interface ReceiptPayload {
  customer_id: number;
  receipt_date: string;
  amount: number;
  payment_method: PaymentMethod;
  bank_account?: string | null;
  cheque_no?: string | null;
  cheque_date?: string | null;
  reference_no?: string | null;
  allocations?: ReceiptAllocationPayload[];
  note?: string | null;
}

export type UpdateReceiptPayload = Partial<ReceiptPayload>;

// ==================== Receipt Query Params ====================
export interface ReceiptQueryParams extends BaseQueryParams, DateRange {
  customer_id?: number;
  status?: ReceiptStatus | ReceiptStatus[];
  receipt_no?: string;
  payment_method?: PaymentMethod;
  has_unallocated?: boolean;
  date_from?: string;
  date_to?: string;
}

// ==================== Receipt List Response ====================
export type ReceiptListResponse = PaginatedResponse<Receipt>;

// ==================== Receipt Summary ====================
export interface ReceiptSummary {
  total_receipts: number;
  total_amount: string;
  total_allocated: string;
  total_unallocated: string;
  by_status: {
    draft: number;
    posted: number;
    cancelled: number;
  };
  by_payment_method: Record<PaymentMethod, number>;
}

// ==================== Receipt Helpers ====================
export const calculateTotalAllocated = (allocations: ReceiptAllocationPayload[]): number => {
  return allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
};

export const calculateUnallocated = (totalAmount: number, allocations: ReceiptAllocationPayload[]): number => {
  const allocated = calculateTotalAllocated(allocations);
  return totalAmount - allocated;
};

export const canPostReceipt = (receipt: Receipt): boolean => {
  return receipt.status === 'draft';
};

export const canCancelReceipt = (receipt: Receipt): boolean => {
  return receipt.status === 'draft' || receipt.status === 'posted';
};

export const canEditReceipt = (receipt: Receipt): boolean => {
  return receipt.status === 'draft';
};

export const isFullyAllocated = (receipt: Receipt): boolean => {
  if (!receipt.unallocated_amount) {
    return false;
  }
  return parseFloat(receipt.unallocated_amount) === 0;
};

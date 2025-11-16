/**
 * AR System - Common Types and Interfaces
 * ไฟล์รวม types ที่ใช้ร่วมกันทั่วทั้ง AR module
 */

// ==================== Pagination ====================
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page?: number;
    from?: number;
    to?: number;
  };
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

// ==================== Common Query Params ====================
export interface BaseQueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// ==================== Date Range ====================
export interface DateRange {
  date_from?: string;
  date_to?: string;
}

// ==================== Customer Reference ====================
export interface CustomerRef {
  id: number;
  code: string;
  name: string;
}

// ==================== User Reference ====================
export interface UserRef {
  id: number;
  name: string;
  email?: string;
}

// ==================== Status Types ====================
export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
export type ReceiptStatus = 'draft' | 'posted' | 'cancelled';
export type CreditNoteStatus = 'draft' | 'issued' | 'cancelled';
export type DepositStatus = 'active' | 'allocated' | 'refunded';
export type PaymentReminderStatus = 'pending' | 'sent' | 'failed';
export type WriteOffStatus = 'draft' | 'approved' | 'posted' | 'cancelled';
export type RecurringInvoiceStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type CreditHistoryStatus = 'pending' | 'approved' | 'rejected';

// ==================== Payment Method ====================
export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'credit_card' | 'promissory_note';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'เงินสด',
  bank_transfer: 'โอนเงิน',
  cheque: 'เช็ค',
  credit_card: 'บัตรเครดิต',
  promissory_note: 'ตั๋วเงิน',
};

// ==================== Status Badge Colors ====================
export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'grey',
  issued: 'blue',
  partially_paid: 'orange',
  paid: 'green',
  overdue: 'red',
  cancelled: 'grey-7',
};

export const RECEIPT_STATUS_COLORS: Record<ReceiptStatus, string> = {
  draft: 'grey',
  posted: 'green',
  cancelled: 'red',
};

export const CREDIT_NOTE_STATUS_COLORS: Record<CreditNoteStatus, string> = {
  draft: 'grey',
  issued: 'green',
  cancelled: 'red',
};

export const DEPOSIT_STATUS_COLORS: Record<DepositStatus, string> = {
  active: 'blue',
  allocated: 'green',
  refunded: 'orange',
};

// ==================== Aging Buckets ====================
export type AgingBucket = 'current' | 'overdue_1_30' | 'overdue_31_60' | 'overdue_61_90' | 'overdue_90_plus';

export const AGING_BUCKET_LABELS: Record<AgingBucket, string> = {
  current: 'ยังไม่ถึงกำหนด',
  overdue_1_30: 'เกิน 1-30 วัน',
  overdue_31_60: 'เกิน 31-60 วัน',
  overdue_61_90: 'เกิน 61-90 วัน',
  overdue_90_plus: 'เกิน 90+ วัน',
};

// ==================== Currency Formatting ====================
export const formatCurrency = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('th-TH', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatCurrencyWithSymbol = (value: number | string): string => {
  return `฿${formatCurrency(value)}`;
};

// ==================== Date Formatting ====================
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ==================== API Response Helpers ====================
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
};

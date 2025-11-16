/**
 * AR System - Credit Note Types
 * ไฟล์รวม types สำหรับใบลดหนี้ (AR Credit Notes)
 */

import type {
  CustomerRef,
  CreditNoteStatus,
  BaseQueryParams,
  DateRange,
  PaginatedResponse,
} from './common';

// ==================== Credit Note Type ====================
export type CreditNoteType = 'return' | 'discount' | 'adjustment';

export const CREDIT_NOTE_TYPE_LABELS: Record<CreditNoteType, string> = {
  return: 'คืนสินค้า',
  discount: 'ส่วนลด',
  adjustment: 'ปรับปรุงยอด',
};

export const CREDIT_NOTE_TYPE_COLORS: Record<CreditNoteType, string> = {
  return: 'orange',
  discount: 'green',
  adjustment: 'blue',
};

// ==================== Credit Note ====================
export interface CreditNote {
  id: number;
  customer: CustomerRef;
  invoice: {
    id: number;
    invoice_no: string;
    invoice_date: string;
    open_amount: string;
  } | null;
  sales_return_id: number | null;

  credit_note_no: string;
  issue_date: string;
  amount: string;

  // Type
  type: CreditNoteType;
  type_label?: string;

  // Reason
  reason: string | null;

  // Status
  status: CreditNoteStatus;
  status_label?: string;

  // Dates
  issued_at: string | null;
  cancelled_at: string | null;

  // GL Entry
  gl_entry_id: number | null;

  // Metadata
  note: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== Credit Note Payload ====================
export interface CreditNotePayload {
  customer_id: number;
  invoice_id?: number | null;
  sales_return_id?: number | null;
  issue_date: string;
  amount: number;
  type: CreditNoteType;
  reason?: string | null;
  note?: string | null;
}

export type UpdateCreditNotePayload = Partial<CreditNotePayload>;

// ==================== Credit Note Query Params ====================
export interface CreditNoteQueryParams extends BaseQueryParams, DateRange {
  customer_id?: number;
  invoice_id?: number;
  status?: CreditNoteStatus | CreditNoteStatus[];
  type?: CreditNoteType | CreditNoteType[];
  credit_note_no?: string;
  date_from?: string;
  date_to?: string;
}

// ==================== Credit Note List Response ====================
export type CreditNoteListResponse = PaginatedResponse<CreditNote>;

// ==================== Credit Note Summary ====================
export interface CreditNoteSummary {
  total_credit_notes: number;
  total_amount: string;
  by_status: {
    draft: number;
    issued: number;
    cancelled: number;
  };
  by_type: {
    return: number;
    discount: number;
    adjustment: number;
  };
}

// ==================== Credit Note Helpers ====================
export const canIssueCreditNote = (creditNote: CreditNote): boolean => {
  return creditNote.status === 'draft';
};

export const canCancelCreditNote = (creditNote: CreditNote): boolean => {
  return creditNote.status === 'issued';
};

export const canEditCreditNote = (creditNote: CreditNote): boolean => {
  return creditNote.status === 'draft';
};

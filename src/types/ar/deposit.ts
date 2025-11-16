/**
 * AR System - Customer Deposit Types
 * ไฟล์รวม types สำหรับเงินมัดจำลูกค้า (Customer Deposits)
 */

import type {
  CustomerRef,
  DepositStatus,
  PaymentMethod,
  BaseQueryParams,
  DateRange,
  PaginatedResponse,
} from './common';

// ==================== Deposit Allocation ====================
export interface DepositAllocation {
  id: number;
  deposit_id: number;
  invoice_id: number;
  invoice?: {
    id: number;
    invoice_no: string;
    invoice_date: string;
    open_amount: string;
  };
  allocated_amount: string;
  created_at: string;
  updated_at: string;
}

export interface DepositAllocationPayload {
  invoice_id: number;
  amount: number;
}

// ==================== Customer Deposit ====================
export interface CustomerDeposit {
  id: number;
  customer: CustomerRef;
  deposit_no: string;
  deposit_date: string;

  // Amounts
  amount: string;
  balance: string;
  total_allocated?: string;

  // Payment details
  payment_method: PaymentMethod;
  payment_method_label?: string;
  payment_ref: string | null;

  // Status
  status: DepositStatus;
  status_label?: string;

  // Dates
  refunded_at: string | null;

  // Relations
  allocations?: DepositAllocation[];
  allocations_count?: number;

  // Metadata
  note: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== Deposit Payload ====================
export interface DepositPayload {
  customer_id: number;
  deposit_date: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_ref?: string | null;
  note?: string | null;
}

export type UpdateDepositPayload = Partial<DepositPayload>;

// ==================== Deposit Allocate Payload ====================
export interface AllocateDepositPayload {
  invoice_id: number;
  amount: number;
}

// ==================== Deposit Refund Payload ====================
export interface RefundDepositPayload {
  amount: number;
  note?: string | null;
}

// ==================== Deposit Query Params ====================
export interface DepositQueryParams extends BaseQueryParams, DateRange {
  customer_id?: number;
  status?: DepositStatus | DepositStatus[];
  deposit_no?: string;
  payment_method?: PaymentMethod;
  has_balance?: boolean; // balance > 0
  date_from?: string;
  date_to?: string;
}

// ==================== Deposit List Response ====================
export type DepositListResponse = PaginatedResponse<CustomerDeposit>;

// ==================== Deposit Summary ====================
export interface DepositSummary {
  total_deposits: number;
  total_amount: string;
  total_balance: string;
  total_allocated: string;
  total_refunded: string;
  by_status: {
    active: number;
    allocated: number;
    refunded: number;
  };
}

// ==================== Deposit Helpers ====================
export const canAllocateDeposit = (deposit: CustomerDeposit): boolean => {
  return deposit.status === 'active' && parseFloat(deposit.balance) > 0;
};

export const canRefundDeposit = (deposit: CustomerDeposit): boolean => {
  return deposit.status === 'active' && parseFloat(deposit.balance) > 0;
};

export const getAvailableBalance = (deposit: CustomerDeposit): number => {
  return parseFloat(deposit.balance);
};

export const getTotalAllocated = (deposit: CustomerDeposit): number => {
  return parseFloat(deposit.total_allocated || '0');
};

export const isFullyAllocated = (deposit: CustomerDeposit): boolean => {
  return parseFloat(deposit.balance) === 0 && deposit.status === 'allocated';
};

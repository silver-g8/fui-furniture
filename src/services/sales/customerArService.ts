/**
 * Customer AR Service
 * Service สำหรับดึงข้อมูล AR ของลูกค้า
 */

import { salesApi } from './api';

export interface CustomerArSummary {
  customer_id: number;
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
}

export interface CustomerOutstandingInvoice {
  invoice_id: number;
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  grand_total: string;
  paid_total: string;
  open_amount: string;
  days_overdue: number;
  status: string;
}

export interface CustomerPaymentHistory {
  receipt_id: number;
  receipt_no: string;
  receipt_date: string;
  amount: string;
  payment_method: string;
  allocated_invoices: Array<{
    invoice_no: string;
    allocated_amount: string;
  }>;
}

export interface CustomerCreditNote {
  credit_note_id: number;
  credit_note_no: string;
  credit_note_date: string;
  amount: string;
  status: string;
  reason: string;
}

export interface CustomerDeposit {
  deposit_id: number;
  deposit_no: string;
  deposit_date: string;
  amount: string;
  allocated_amount: string;
  available_balance: string;
  status: string;
}

/**
 * ดึงข้อมูล AR Summary ของลูกค้า
 */
export const getCustomerArSummary = async (
  customerId: number,
): Promise<CustomerArSummary> => {
  const response = await salesApi.get<CustomerArSummary>(
    `/customers/${customerId}/ar-summary`,
  );
  return response.data;
};

/**
 * ดึงข้อมูล Outstanding Invoices ของลูกค้า
 */
export const getCustomerOutstandingInvoices = async (
  customerId: number,
): Promise<CustomerOutstandingInvoice[]> => {
  const response = await salesApi.get<CustomerOutstandingInvoice[]>(
    `/customers/${customerId}/outstanding-invoices`,
  );
  return response.data;
};

/**
 * ดึงข้อมูล Payment History ของลูกค้า
 */
export const getCustomerPaymentHistory = async (
  customerId: number,
  limit?: number,
): Promise<CustomerPaymentHistory[]> => {
  const response = await salesApi.get<CustomerPaymentHistory[]>(
    `/customers/${customerId}/payment-history`,
    {
      params: limit ? { limit } : undefined,
    },
  );
  return response.data;
};

/**
 * ดึงข้อมูล Credit Notes ของลูกค้า
 */
export const getCustomerCreditNotes = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _customerId: number,
): Promise<CustomerCreditNote[]> => {
  // TODO: สร้าง API endpoint ใน backend
  // สำหรับตอนนี้ใช้ mock data
  return Promise.resolve([]);
};

/**
 * ดึงข้อมูล Deposits ของลูกค้า
 */
export const getCustomerDeposits = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _customerId: number,
): Promise<CustomerDeposit[]> => {
  // TODO: สร้าง API endpoint ใน backend
  // สำหรับตอนนี้ใช้ mock data
  return Promise.resolve([]);
};


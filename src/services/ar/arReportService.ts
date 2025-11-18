/**
 * AR Report Service
 * Service สำหรับดึงข้อมูล Reports ของ AR System
 */

import { api } from 'boot/axios';

export interface AgingBucketDetail {
  bucket: 'current' | 'overdue_1_30' | 'overdue_31_60' | 'overdue_61_90' | 'overdue_90_plus';
  amount: string;
  count: number;
}

export interface CustomerAgingDetail {
  customer_id: number;
  customer_code: string;
  customer_name: string;
  total_outstanding: string;
  buckets: {
    current: string;
    overdue_1_30: string;
    overdue_31_60: string;
    overdue_61_90: string;
    overdue_90_plus: string;
  };
  invoices?: Array<{
    invoice_id: number;
    invoice_no: string;
    invoice_date: string;
    due_date: string;
    grand_total: string;
    paid_total: string;
    open_amount: string;
    days_overdue: number;
    bucket: string;
  }>;
}

export interface AgingReportData {
  as_of_date: string;
  summary: {
    total_customers: number;
    total_outstanding: string;
    buckets: AgingBucketDetail[];
  };
  customers: CustomerAgingDetail[];
  include_invoices?: boolean;
}

export interface StatementTransaction {
  id: number;
  date: string;
  type: 'invoice' | 'receipt' | 'credit_note' | 'deposit';
  reference_no: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
}

export interface StatementReportData {
  customer_id: number;
  customer_code: string;
  customer_name: string;
  date_from: string;
  date_to: string;
  opening_balance: string;
  closing_balance: string;
  transactions: StatementTransaction[];
}

/**
 * ดึงข้อมูล Aging Report
 */
export const getAgingReport = async (
  asOfDate?: string,
  includeInvoices: boolean = false,
): Promise<AgingReportData> => {
  const response = await api.get<AgingReportData>('/ar/reports/aging', {
    params: {
      as_of_date: asOfDate,
      include_invoices: includeInvoices,
    },
  });
  return response.data;
};

/**
 * ดึงข้อมูล Statement Report
 */
export const getStatementReport = async (
  customerId: number,
  dateFrom: string,
  dateTo: string,
): Promise<StatementReportData> => {
  const response = await api.get<StatementReportData>('/ar/reports/statement', {
    params: {
      customer_id: customerId,
      date_from: dateFrom,
      date_to: dateTo,
    },
  });
  return response.data;
};


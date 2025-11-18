/**
 * AR Pending Payment Service
 * Service สำหรับจัดการ API ของ Invoice ที่ชำระเงินครบแล้ว (รอการลบ)
 */

import { api } from 'boot/axios';

const BASE_URL = '/ar/pending-payments';

export interface PendingPaymentInvoice {
  id: number;
  invoice_no: string;
  invoice_date: string;
  grand_total: number;
  paid_total: number;
  open_amount: number;
  status: string;
  customer?: {
    id: number;
    name: string;
  };
  sales_order?: {
    id: number;
    sales_order_no: string;
  };
}

export interface CleanupResponse {
  message: string;
  deleted_count: number;
  errors: Array<{
    invoice_id: number;
    invoice_no: string;
    error: string;
  }>;
}

/**
 * ดึงรายการ Invoice ที่ชำระเงินครบแล้ว (รอการลบ)
 * @param customerId - ID ของลูกค้า (optional) สำหรับกรองตามลูกค้า
 * @returns รายการ Invoice ที่ชำระเงินครบแล้ว (open_amount <= 0)
 */
export const getPendingPayments = async (
  customerId?: number,
): Promise<{ data: PendingPaymentInvoice[] }> => {
  const params = customerId ? { customer_id: customerId } : {};
  const response = await api.get<{ data: PendingPaymentInvoice[] }>(BASE_URL, { params });
  return response.data;
};

/**
 * ตรวจสอบและลบ Invoice ที่ชำระเงินแล้ว
 * @param customerId - ID ของลูกค้า (optional) สำหรับกรองตามลูกค้า
 * @returns ผลลัพธ์การลบ Invoice
 */
export const cleanupPaidInvoices = async (customerId?: number): Promise<CleanupResponse> => {
  const params = customerId ? { customer_id: customerId } : {};
  const response = await api.post<CleanupResponse>(`${BASE_URL}/cleanup`, null, { params });
  return response.data;
};

/**
 * ลบ Invoice ที่ชำระเงินแล้วรายการเดียว
 * @param invoiceId - ID ของ Invoice ที่ต้องการลบ
 * @returns ข้อความยืนยันการลบ
 */
export const deleteSingleInvoice = async (invoiceId: number): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`${BASE_URL}/${invoiceId}`);
  return response.data;
};


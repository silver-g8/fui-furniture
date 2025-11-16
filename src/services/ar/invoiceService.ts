/**
 * AR Invoice Service
 * Service สำหรับจัดการ API ของใบแจ้งหนี้ (AR Invoices)
 */

import { api } from 'boot/axios';
import type {
  Invoice,
  InvoicePayload,
  UpdateInvoicePayload,
  InvoiceQueryParams,
  InvoiceListResponse,
  InvoiceSummary,
} from '@/types/ar/invoice';

const BASE_URL = '/ar/invoices';

/**
 * ดึงรายการใบแจ้งหนี้ทั้งหมด (พร้อม pagination)
 */
export const getInvoices = async (params?: InvoiceQueryParams): Promise<InvoiceListResponse> => {
  const response = await api.get<InvoiceListResponse>(BASE_URL, { params });
  return response.data;
};

/**
 * ดึงข้อมูลใบแจ้งหนี้ตาม ID
 */
export const getInvoiceById = async (id: number): Promise<Invoice> => {
  const response = await api.get<Invoice>(`${BASE_URL}/${id}`);
  return response.data;
};

/**
 * สร้างใบแจ้งหนี้ใหม่ (พร้อม line items)
 */
export const createInvoice = async (payload: InvoicePayload): Promise<Invoice> => {
  const response = await api.post<Invoice>(BASE_URL, payload);
  return response.data;
};

/**
 * แก้ไขใบแจ้งหนี้ (เฉพาะสถานะ draft)
 */
export const updateInvoice = async (id: number, payload: UpdateInvoicePayload): Promise<Invoice> => {
  const response = await api.put<Invoice>(`${BASE_URL}/${id}`, payload);
  return response.data;
};

/**
 * ลบใบแจ้งหนี้ (เฉพาะสถานะ draft)
 */
export const deleteInvoice = async (id: number): Promise<void> => {
  await api.delete(`${BASE_URL}/${id}`);
};

/**
 * ออกใบแจ้งหนี้ (เปลี่ยนสถานะจาก draft → issued)
 */
export const issueInvoice = async (id: number): Promise<Invoice> => {
  const response = await api.post<Invoice>(`${BASE_URL}/${id}/issue`);
  return response.data;
};

/**
 * ยกเลิกใบแจ้งหนี้
 */
export const cancelInvoice = async (id: number): Promise<Invoice> => {
  const response = await api.post<Invoice>(`${BASE_URL}/${id}/cancel`);
  return response.data;
};

/**
 * ส่งแจ้งเตือนการชำระเงินสำหรับใบแจ้งหนี้
 */
export const sendInvoiceReminder = async (
  id: number,
  channel: 'email' | 'sms' | 'line' = 'email',
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`${BASE_URL}/${id}/send-reminder`, {
    channel,
  });
  return response.data;
};

/**
 * ดึงสรุปข้อมูลใบแจ้งหนี้
 */
export const getInvoiceSummary = async (params?: InvoiceQueryParams): Promise<InvoiceSummary> => {
  const response = await api.get<InvoiceSummary>(`${BASE_URL}/summary`, { params });
  return response.data;
};

/**
 * Bulk issue invoices (ออกใบแจ้งหนี้หลายใบพร้อมกัน)
 */
export const bulkIssueInvoices = async (invoiceIds: number[]): Promise<{
  message: string;
  results: {
    success: number;
    failed: number;
    errors: Array<{ invoice_id: number; error: string }>;
  };
}> => {
  const response = await api.post('/ar/bulk/invoices/issue', { invoice_ids: invoiceIds });
  return response.data;
};

/**
 * Bulk cancel invoices (ยกเลิกใบแจ้งหนี้หลายใบพร้อมกัน)
 */
export const bulkCancelInvoices = async (invoiceIds: number[]): Promise<{
  message: string;
  results: {
    success: number;
    failed: number;
    errors: Array<{ invoice_id: number; error: string }>;
  };
}> => {
  const response = await api.post('/ar/bulk/invoices/cancel', { invoice_ids: invoiceIds });
  return response.data;
};

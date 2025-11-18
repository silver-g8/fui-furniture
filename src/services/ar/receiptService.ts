/**
 * AR Receipt Service
 * Service สำหรับจัดการ API ของใบเสร็จรับเงิน (AR Receipts)
 */

import { api } from 'boot/axios';
import type {
  Receipt,
  ReceiptPayload,
  UpdateReceiptPayload,
  ReceiptQueryParams,
  ReceiptListResponse,
  ReceiptSummary,
} from '@/types/ar/receipt';

const BASE_URL = '/ar/receipts';

/**
 * ดึงรายการใบเสร็จรับเงินทั้งหมด (พร้อม pagination)
 */
export const getReceipts = async (params?: ReceiptQueryParams): Promise<ReceiptListResponse> => {
  const response = await api.get<ReceiptListResponse>(BASE_URL, { params });
  return response.data;
};

/**
 * ดึงข้อมูลใบเสร็จตาม ID
 */
export const getReceiptById = async (id: number): Promise<Receipt> => {
  const response = await api.get<Receipt>(`${BASE_URL}/${id}`);
  return response.data;
};

/**
 * สร้างใบเสร็จใหม่ (พร้อมการจัดสรรเงิน)
 */
export const createReceipt = async (payload: ReceiptPayload): Promise<Receipt> => {
  const response = await api.post<Receipt>(BASE_URL, payload);
  return response.data;
};

/**
 * แก้ไขใบเสร็จ (เฉพาะสถานะ draft)
 */
export const updateReceipt = async (id: number, payload: UpdateReceiptPayload): Promise<Receipt> => {
  const response = await api.put<Receipt>(`${BASE_URL}/${id}`, payload);
  return response.data;
};

/**
 * ลบใบเสร็จ (เฉพาะสถานะ draft)
 */
export const deleteReceipt = async (id: number): Promise<void> => {
  await api.delete(`${BASE_URL}/${id}`);
};

/**
 * Post ใบเสร็จ (เปลี่ยนสถานะจาก draft → posted)
 */
export const postReceipt = async (id: number): Promise<Receipt> => {
  const response = await api.post<Receipt>(`${BASE_URL}/${id}/post`);
  return response.data;
};

/**
 * ยกเลิกใบเสร็จ
 */
export const cancelReceipt = async (id: number): Promise<Receipt> => {
  const response = await api.post<Receipt>(`${BASE_URL}/${id}/cancel`);
  return response.data;
};

/**
 * Create receipt from pending payment invoice
 * สำหรับ Invoice ที่เป็น pending payment (cash sale with non-cash payment method)
 */
export interface CreateReceiptFromPendingPaymentPayload {
  payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'credit_card' | 'promissory_note' | 'qr_code' | 'online_store';
  receipt_date?: string;
  reference_no?: string | null;
  note?: string | null;
}

export const createReceiptFromPendingPayment = async (
  invoiceId: number,
  payload: CreateReceiptFromPendingPaymentPayload,
): Promise<Receipt> => {
  const response = await api.post<Receipt>(
    `/ar/invoices/${invoiceId}/create-receipt-from-pending-payment`,
    payload,
  );
  return response.data;
};

/**
 * ดึงสรุปข้อมูลใบเสร็จ
 */
export const getReceiptSummary = async (params?: ReceiptQueryParams): Promise<ReceiptSummary> => {
  const response = await api.get<ReceiptSummary>(`${BASE_URL}/summary`, { params });
  return response.data;
};

/**
 * Bulk post receipts (Post ใบเสร็จหลายใบพร้อมกัน)
 */
export const bulkPostReceipts = async (receiptIds: number[]): Promise<{
  message: string;
  results: {
    success: number;
    failed: number;
    errors: Array<{ receipt_id: number; error: string }>;
  };
}> => {
  const response = await api.post('/ar/bulk/receipts/post', { receipt_ids: receiptIds });
  return response.data;
};

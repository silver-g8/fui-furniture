/**
 * AR Credit Note Service
 * Service สำหรับจัดการ API ของใบลดหนี้ (AR Credit Notes)
 */

import { api } from 'boot/axios';
import type {
  CreditNote,
  CreditNotePayload,
  UpdateCreditNotePayload,
  CreditNoteQueryParams,
  CreditNoteListResponse,
  CreditNoteSummary,
} from '@/types/ar/creditNote';

const BASE_URL = '/ar/credit-notes';

/**
 * ดึงรายการใบลดหนี้ทั้งหมด (พร้อม pagination)
 */
export const getCreditNotes = async (
  params?: CreditNoteQueryParams,
): Promise<CreditNoteListResponse> => {
  const response = await api.get<CreditNoteListResponse>(BASE_URL, { params });
  return response.data;
};

/**
 * ดึงข้อมูลใบลดหนี้ตาม ID
 */
export const getCreditNoteById = async (id: number): Promise<CreditNote> => {
  const response = await api.get<CreditNote>(`${BASE_URL}/${id}`);
  return response.data;
};

/**
 * สร้างใบลดหนี้ใหม่
 */
export const createCreditNote = async (payload: CreditNotePayload): Promise<CreditNote> => {
  const response = await api.post<CreditNote>(BASE_URL, payload);
  return response.data;
};

/**
 * แก้ไขใบลดหนี้ (เฉพาะสถานะ draft)
 */
export const updateCreditNote = async (
  id: number,
  payload: UpdateCreditNotePayload,
): Promise<CreditNote> => {
  const response = await api.put<CreditNote>(`${BASE_URL}/${id}`, payload);
  return response.data;
};

/**
 * ลบใบลดหนี้ (เฉพาะสถานะ draft)
 */
export const deleteCreditNote = async (id: number): Promise<void> => {
  await api.delete(`${BASE_URL}/${id}`);
};

/**
 * ออกใบลดหนี้ (เปลี่ยนสถานะจาก draft → issued)
 */
export const issueCreditNote = async (id: number): Promise<CreditNote> => {
  const response = await api.post<CreditNote>(`${BASE_URL}/${id}/issue`);
  return response.data;
};

/**
 * ยกเลิกใบลดหนี้
 */
export const cancelCreditNote = async (id: number): Promise<CreditNote> => {
  const response = await api.post<CreditNote>(`${BASE_URL}/${id}/cancel`);
  return response.data;
};

/**
 * ดึงสรุปข้อมูลใบลดหนี้
 */
export const getCreditNoteSummary = async (
  params?: CreditNoteQueryParams,
): Promise<CreditNoteSummary> => {
  const response = await api.get<CreditNoteSummary>(`${BASE_URL}/summary`, { params });
  return response.data;
};

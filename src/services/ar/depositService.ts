/**
 * AR Customer Deposit Service
 * Service สำหรับจัดการ API ของเงินมัดจำลูกค้า (Customer Deposits)
 */

import { api } from 'boot/axios';
import type {
  CustomerDeposit,
  DepositPayload,
  UpdateDepositPayload,
  AllocateDepositPayload,
  RefundDepositPayload,
  DepositQueryParams,
  DepositListResponse,
  DepositSummary,
} from '@/types/ar/deposit';

const BASE_URL = '/ar/deposits';

/**
 * ดึงรายการเงินมัดจำทั้งหมด (พร้อม pagination)
 */
export const getDeposits = async (params?: DepositQueryParams): Promise<DepositListResponse> => {
  const response = await api.get<DepositListResponse>(BASE_URL, { params });
  return response.data;
};

/**
 * ดึงข้อมูลเงินมัดจำตาม ID
 */
export const getDepositById = async (id: number): Promise<CustomerDeposit> => {
  const response = await api.get<CustomerDeposit>(`${BASE_URL}/${id}`);
  return response.data;
};

/**
 * สร้างเงินมัดจำใหม่
 */
export const createDeposit = async (payload: DepositPayload): Promise<CustomerDeposit> => {
  const response = await api.post<CustomerDeposit>(BASE_URL, payload);
  return response.data;
};

/**
 * แก้ไขเงินมัดจำ
 */
export const updateDeposit = async (
  id: number,
  payload: UpdateDepositPayload,
): Promise<CustomerDeposit> => {
  const response = await api.put<CustomerDeposit>(`${BASE_URL}/${id}`, payload);
  return response.data;
};

/**
 * ลบเงินมัดจำ
 */
export const deleteDeposit = async (id: number): Promise<void> => {
  await api.delete(`${BASE_URL}/${id}`);
};

/**
 * จัดสรรเงินมัดจำไปยังใบแจ้งหนี้
 */
export const allocateDeposit = async (
  id: number,
  payload: AllocateDepositPayload,
): Promise<CustomerDeposit> => {
  const response = await api.post<CustomerDeposit>(`${BASE_URL}/${id}/allocate`, payload);
  return response.data;
};

/**
 * คืนเงินมัดจำ
 */
export const refundDeposit = async (
  id: number,
  payload: RefundDepositPayload,
): Promise<CustomerDeposit> => {
  const response = await api.post<CustomerDeposit>(`${BASE_URL}/${id}/refund`, payload);
  return response.data;
};

/**
 * ดึงสรุปข้อมูลเงินมัดจำ
 */
export const getDepositSummary = async (params?: DepositQueryParams): Promise<DepositSummary> => {
  const response = await api.get<DepositSummary>(`${BASE_URL}/summary`, { params });
  return response.data;
};

/**
 * ดึงเงินมัดจำของลูกค้าที่ยังมี balance (สำหรับเลือกในฟอร์ม)
 */
export const getAvailableDeposits = async (customerId: number): Promise<CustomerDeposit[]> => {
  const response = await api.get<{ data: CustomerDeposit[] }>(BASE_URL, {
    params: {
      customer_id: customerId,
      status: 'active',
      has_balance: true,
    },
  });
  return response.data.data;
};

import { api } from 'boot/axios';
import type { AxiosInstance } from 'axios';

export const salesApi: AxiosInstance = api;

export interface Customer {
  id: number;
  code: string;
  name: string;
  email: string;
  phone: string;
  tax_id?: string | null;
  address?: string;
  shipping_address?: string | null;
  billing_address?: string | null;
  is_active: boolean;
  notes?: string;
  payment_type: 'cash' | 'credit';
  customer_group?: 'personal' | 'government' | 'organization';
  customer_group_label?: string;
  is_credit?: boolean;
  credit_limit?: number | null;
  credit_term_days?: number | null;
  outstanding_balance: number;
  is_over_credit_limit?: boolean;
  is_overdue?: boolean;
  days_overdue?: number;
  credit_utilization_percentage?: number;
  credit_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchasedProduct {
  id: number;
  sku: string;
  name: string;
  brand: string | null;
  category: string | null;
  price: string;
  image_url: string | null;
}

export interface CustomerListParams {
  search?: string;
  is_active?: boolean | number;
  payment_type?: 'cash' | 'credit';
  customer_group?: 'personal' | 'government' | 'organization';
  has_outstanding?: boolean;
  over_credit_limit?: boolean;
  sort?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

export type CustomerPayload = {
  code: string;
  name: string;
  email: string;
  phone: string;
  tax_id?: string | null | undefined;
  address?: string | undefined;
  shipping_address?: string | null | undefined;
  billing_address?: string | null | undefined;
  is_active?: boolean | undefined;
  notes?: string | null | undefined;
  payment_type: 'cash' | 'credit';
  customer_group?: 'personal' | 'government' | 'organization' | undefined;
  credit_limit?: number | null | undefined;
  credit_term_days?: number | null | undefined;
  credit_note?: string | null | undefined;
};

export const listCustomers = async (
  params: CustomerListParams = {},
): Promise<PaginatedResponse<Customer>> => {
  const response = await salesApi.get<PaginatedResponse<Customer>>('/customers', {
    params,
  });
  return response.data;
};

export const getCustomer = async (id: number): Promise<Customer> => {
  const response = await salesApi.get<Customer>(`/customers/${id}`);
  return response.data;
};

export const createCustomer = async (payload: CustomerPayload): Promise<Customer> => {
  const response = await salesApi.post<Customer>('/customers', payload);
  return response.data;
};

export const updateCustomer = async (
  id: number,
  payload: Partial<CustomerPayload>,
): Promise<Customer> => {
  const response = await salesApi.put<Customer>(`/customers/${id}`, payload);
  return response.data;
};

export const deleteCustomer = async (id: number): Promise<void> => {
  await salesApi.delete(`/customers/${id}`);
};

export const getCustomerPurchases = async (id: number): Promise<PurchasedProduct[]> => {
  const response = await salesApi.get<{ data: PurchasedProduct[] }>(`/customers/${id}/purchases`);
  return response.data.data;
};

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  is_active?: boolean;
}

export const listWarehouses = async (): Promise<Warehouse[]> => {
  try {
    const response = await salesApi.get<{ data: Warehouse[] }>('/warehouses');
    return response.data.data || [];
  } catch {
    // ถ้า API ไม่มี ให้ return empty array
    console.warn('Warehouses API not available, returning empty array');
    return [];
  }
};

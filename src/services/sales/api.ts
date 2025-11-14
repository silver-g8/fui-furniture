import { api } from 'boot/axios';
import type { AxiosInstance } from 'axios';

export const salesApi: AxiosInstance = api;

export interface Customer {
  id: number;
  code: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  is_active: boolean;
  notes?: string;
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

export const getCustomer = async (id: number): Promise<Customer> => {
  const response = await salesApi.get<Customer>(`/customers/${id}`);
  return response.data;
};

export const getCustomerPurchases = async (id: number): Promise<PurchasedProduct[]> => {
  const response = await salesApi.get<{ data: PurchasedProduct[] }>(`/customers/${id}/purchases`);
  return response.data.data;
};


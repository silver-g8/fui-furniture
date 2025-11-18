import { salesApi } from './api';

export interface SalesByCustomer {
  customer_id: number;
  customer_code: string;
  customer_name: string;
  order_count: number;
  total_amount: number;
  avg_amount: number;
}

export interface SalesByProduct {
  product_id: number;
  product_code: string;
  product_name: string;
  total_qty: number;
  total_amount: number;
  avg_price: number;
}

export interface SalesByPeriod {
  date: string;
  order_count: number;
  total_amount: number;
  avg_amount: number;
}

export interface QuotationConversionResponse {
  conversion_rate: number;
  filters: {
    date_from?: string;
    date_to?: string;
    customer_id?: number;
  };
}

export interface SalesReportFilters {
  date_from?: string;
  date_to?: string;
  customer_id?: number;
  product_id?: number;
}

export const getSalesByCustomer = async (
  filters: SalesReportFilters = {},
): Promise<{ data: SalesByCustomer[]; filters: SalesReportFilters }> => {
  const response = await salesApi.get<{
    data: SalesByCustomer[];
    filters: SalesReportFilters;
  }>('/sales/reports/by-customer', {
    params: filters,
  });
  return response.data;
};

export const getSalesByProduct = async (
  filters: SalesReportFilters = {},
): Promise<{ data: SalesByProduct[]; filters: SalesReportFilters }> => {
  const response = await salesApi.get<{
    data: SalesByProduct[];
    filters: SalesReportFilters;
  }>('/sales/reports/by-product', {
    params: filters,
  });
  return response.data;
};

export const getSalesByPeriod = async (
  dateFrom: string,
  dateTo: string,
): Promise<{
  data: SalesByPeriod[];
  date_from: string;
  date_to: string;
}> => {
  const response = await salesApi.get<{
    data: SalesByPeriod[];
    date_from: string;
    date_to: string;
  }>('/sales/reports/by-period', {
    params: {
      date_from: dateFrom,
      date_to: dateTo,
    },
  });
  return response.data;
};

export const getQuotationConversionRate = async (
  filters: SalesReportFilters = {},
): Promise<QuotationConversionResponse> => {
  const response = await salesApi.get<QuotationConversionResponse>(
    '/sales/reports/quotation-conversion',
    {
      params: filters,
    },
  );
  return response.data;
};


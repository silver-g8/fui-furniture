/**
 * AR Dashboard Service
 * Service สำหรับดึงข้อมูล Dashboard ของ AR System
 */

import { api } from 'boot/axios';

export interface ArDashboardMetrics {
  total_outstanding: string;
  overdue_amount: string;
  current_month_collection: string;
  dso: number; // Days Sales Outstanding
  collection_rate: number; // Percentage
}

export interface AgingBucketData {
  bucket: 'current' | 'overdue_1_30' | 'overdue_31_60' | 'overdue_61_90' | 'overdue_90_plus';
  amount: string;
  count: number;
}

export interface AgingSummary {
  buckets: AgingBucketData[];
  total: string;
}

export interface CollectionTrendData {
  date: string;
  amount: string;
}

export interface CollectionTrend {
  data: CollectionTrendData[];
  period: 'week' | 'month' | 'quarter';
}

export interface TopCustomer {
  customer_id: number;
  customer_name: string;
  customer_code: string;
  outstanding_amount: string;
  invoice_count: number;
}

export interface TopCustomers {
  customers: TopCustomer[];
  limit: number;
}

export interface ArDashboardData {
  metrics: ArDashboardMetrics;
  aging_summary: AgingSummary;
  collection_trend: CollectionTrend;
  top_customers: TopCustomers;
}

/**
 * ดึงข้อมูล Dashboard ของ AR
 */
export const getArDashboard = async (): Promise<ArDashboardData> => {
  const response = await api.get<ArDashboardData>('/ar/dashboard');
  return response.data;
};

/**
 * ดึงข้อมูล Metrics เท่านั้น
 */
export const getArDashboardMetrics = async (): Promise<ArDashboardMetrics> => {
  const response = await api.get<ArDashboardMetrics>('/ar/dashboard/metrics');
  return response.data;
};

/**
 * ดึงข้อมูล Aging Summary
 */
export const getAgingSummary = async (asOfDate?: string): Promise<AgingSummary> => {
  const response = await api.get<AgingSummary>('/ar/dashboard/aging-summary', {
    params: asOfDate ? { as_of_date: asOfDate } : {},
  });
  return response.data;
};

/**
 * ดึงข้อมูล Collection Trend
 */
export const getCollectionTrend = async (
  period: 'week' | 'month' | 'quarter' = 'month',
): Promise<CollectionTrend> => {
  const response = await api.get<CollectionTrend>('/ar/dashboard/collection-trend', {
    params: { period },
  });
  return response.data;
};

/**
 * ดึงข้อมูล Top Customers
 */
export const getTopCustomers = async (limit: number = 10): Promise<TopCustomers> => {
  const response = await api.get<TopCustomers>('/ar/dashboard/top-customers', {
    params: { limit },
  });
  return response.data;
};


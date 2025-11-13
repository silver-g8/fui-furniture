import { api } from '@/boot/axios';
import { mockDashboardData } from '@/mocks/dashboard';
import type { DashboardDataResponse } from '@/types/dashboard';

export interface DashboardQuery {
  widgets?: string[];
  refresh?: boolean;
}

const shouldUseMockData = () => import.meta.env.DEV;

const buildParams = (query: DashboardQuery): Record<string, unknown> => {
  const params: Record<string, unknown> = {};

  if (query.widgets?.length) {
    params.widgets = query.widgets.join(',');
  }

  if (typeof query.refresh === 'boolean') {
    params.refresh = query.refresh;
  }

  return params;
};

const validatePayload = (payload: unknown): payload is DashboardDataResponse =>
  !!payload &&
  typeof payload === 'object' &&
  Array.isArray((payload as DashboardDataResponse).widgets) &&
  typeof (payload as DashboardDataResponse).lastUpdated === 'string';

const getMockResponse = (): DashboardDataResponse => ({
  ...mockDashboardData,
  lastUpdated: new Date().toISOString(),
});

export async function getDashboardData(
  query: DashboardQuery = {},
): Promise<DashboardDataResponse> {
  try {
    const response = await api.get('/dashboard', { params: buildParams(query) });
    const payload = (response.data?.data as DashboardDataResponse | undefined) ?? response.data;

    if (!validatePayload(payload)) {
      throw new Error('Invalid dashboard response shape');
    }

    return payload;
  } catch (error) {
    if (shouldUseMockData()) {
      console.warn('[dashboard-service] Falling back to mock data due to request failure.', error);
      return getMockResponse();
    }

    throw error instanceof Error ? error : new Error('Failed to fetch dashboard data');
  }
}


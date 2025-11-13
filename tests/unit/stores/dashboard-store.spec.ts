import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useDashboardStore } from '@/stores/dashboard-store';
import { getDashboardData } from '@/services/dashboard-service';
import type { DashboardDataResponse } from '@/types/dashboard';

vi.mock('@/services/dashboard-service', () => ({
  getDashboardData: vi.fn(),
}));

const mockedGetDashboardData = vi.mocked(getDashboardData);

describe('dashboard-store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockedGetDashboardData.mockReset();
  });

  it('ให้ state เริ่มต้นถูกต้อง', () => {
    const store = useDashboardStore();

    expect(store.widgets).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(store.lastUpdated).toBeNull();
  });

  it('เรียก fetchDashboardData แล้วตั้งค่าข้อมูลวิดเจ็ตและเวลาอัปเดต', async () => {
    const response = {
      widgets: [
        {
          id: 'sales-overview',
          type: 'metric',
          title: 'dashboard.widgets.salesOverview.title',
          size: 'medium',
          position: { row: 0, col: 0 },
          data: { value: 125000, label: 'Total Sales' },
        },
      ],
      lastUpdated: '2025-01-27T10:30:00Z',
    } satisfies DashboardDataResponse;
    mockedGetDashboardData.mockResolvedValue(response);

    const store = useDashboardStore();
    await store.fetchDashboardData();

    expect(mockedGetDashboardData).toHaveBeenCalledWith({ refresh: false });
    expect(store.widgets).toEqual(response.widgets);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(store.lastUpdated?.toISOString()).toBe(new Date(response.lastUpdated).toISOString());
  });

  it('ส่ง refresh=true แล้วเรียก service ด้วยพารามิเตอร์ที่ถูกต้อง', async () => {
    mockedGetDashboardData.mockResolvedValue({
      widgets: [],
      lastUpdated: '2025-01-27T11:00:00Z',
    });

    const store = useDashboardStore();
    await store.fetchDashboardData({ refresh: true });

    expect(mockedGetDashboardData).toHaveBeenCalledWith({ refresh: true });
  });

  it('จัดการกรณีเรียก API แล้วเกิดข้อผิดพลาด', async () => {
    mockedGetDashboardData.mockRejectedValue(new Error('Network error'));

    const store = useDashboardStore();
    await store.fetchDashboardData();

    expect(store.widgets).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBe('Network error');
  });
});


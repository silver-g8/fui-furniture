import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { createPinia } from 'pinia';
import routes from '@/router/routes';
import { getDashboardData } from '@/services/dashboard-service';

vi.mock('@/services/dashboard-service', () => ({
  getDashboardData: vi.fn(),
}));

const mockedGetDashboardData = vi.mocked(getDashboardData);

describe('dashboard navigation', () => {
  beforeEach(() => {
    mockedGetDashboardData.mockReset();
    mockedGetDashboardData.mockResolvedValue({
      widgets: [
        {
          id: 'sales-overview',
          type: 'metric',
          title: 'dashboard.widgets.salesOverview.title',
          size: 'medium',
          position: { row: 0, col: 0 },
          data: { value: 125000, label: 'Total Sales', change: 12.5 },
        },
        {
          id: 'recent-orders',
          type: 'table',
          title: 'dashboard.widgets.recentOrders.title',
          size: 'large',
          position: { row: 0, col: 1 },
          data: {
            headers: ['Order ID', 'Customer', 'Amount'],
            rows: [
              ['#12345', 'John Doe', '$1,250'],
              ['#12346', 'Jane Smith', '$890'],
            ],
          },
        },
      ],
      lastUpdated: '2025-01-27T10:30:00Z',
    });
  });

  it('โหลดเพจ /dashboard และแสดงวิดเจ็ตจาก store', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    const pinia = createPinia();

    router.push('/dashboard');
    await router.isReady();

    const wrapper = mount(
      {
        template: '<router-view />',
      },
      {
        global: {
          plugins: [pinia, router],
        },
      },
    );

    await flushPromises();

    expect(mockedGetDashboardData).toHaveBeenCalledTimes(1);

    const cards = wrapper.findAll('[data-testid="dashboard-card"]');
    expect(cards).toHaveLength(2);

    const page = wrapper.find('[data-testid="dashboard-page"]');
    expect(page.exists()).toBe(true);
  });
});


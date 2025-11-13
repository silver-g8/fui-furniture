export default {
  title: 'Dashboard Overview',
  loading: 'Loading data...',
  noData: 'No data available',
  chartSummary: '{points} points • Total {total}',
  lastUpdated: {
    never: 'No data fetched yet',
    at: 'Last updated {datetime}',
  },
  errors: {
    generic: 'We could not load this widget. Please try again.',
  },
  actions: {
    refresh: 'Refresh',
    export: 'Export',
    retry: 'Retry',
  },
  chartTypes: {
    line: 'Line chart',
    bar: 'Bar chart',
    pie: 'Pie chart',
    doughnut: 'Doughnut chart',
    area: 'Area chart',
  },
  widgets: {
    salesOverview: {
      title: 'Sales Overview',
      label: 'Total sales',
      period: 'vs last month',
    },
    recentOrders: {
      title: 'Recent Orders',
    },
    revenueChart: {
      title: 'Revenue Trend',
    },
    inventoryHealth: {
      title: 'Inventory Health',
    },
    topProducts: {
      title: 'Top Selling Products',
    },
    recentActivity: {
      title: 'Recent Activity',
      items: {
        orderCreated: 'New order created',
        stockAdjusted: 'Stock adjustment applied',
        newSupplier: 'New supplier onboarded',
      },
    },
  },
};


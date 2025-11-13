export type DashboardWidgetType = 'metric' | 'chart' | 'table' | 'list' | 'custom';

export interface DashboardWidgetPosition {
  row: number;
  col: number;
  rowSpan?: number;
  colSpan?: number;
}

export type DashboardWidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface DashboardMetricData {
  value: number | string;
  label: string;
  change?: number | null;
  changeType?: 'increase' | 'decrease' | 'neutral' | null;
  period?: string | null;
  unit?: string | null;
  format?: string | null;
}

export interface DashboardChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | null;
  borderColor?: string | null;
}

export interface DashboardChartData {
  labels: string[];
  datasets: DashboardChartDataset[];
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  options?: Record<string, unknown>;
}

export interface DashboardTableData {
  headers: string[];
  rows: Array<Array<string | number | boolean | null>>;
  pagination?: PaginationMeta;
  sortable?: boolean;
}

export interface DashboardListData {
  items: Array<Record<string, unknown>>;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  currentPage?: number;
  perPage?: number;
  total?: number;
  lastPage?: number;
}

export type DashboardWidgetData =
  | DashboardMetricData
  | DashboardChartData
  | DashboardTableData
  | DashboardListData
  | Record<string, unknown>;

export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  title: string;
  size: DashboardWidgetSize;
  position: DashboardWidgetPosition;
  data?: DashboardWidgetData;
  loading?: boolean;
  error?: string | null;
  config?: Record<string, unknown>;
  permission?: string;
}

export interface DashboardState {
  widgets: DashboardWidget[];
  lastUpdated: Date | null;
  loading: boolean;
  error: string | null;
}

export interface DashboardDataResponse {
  widgets: DashboardWidget[];
  lastUpdated: string;
}


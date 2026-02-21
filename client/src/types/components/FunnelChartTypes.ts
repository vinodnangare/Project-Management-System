export interface FunnelData {
  stage: string;
  count: number;
  percentage?: number;
}

export interface FunnelChartProps {
  data: FunnelData[];
  isLoading?: boolean;
  title?: string;
}

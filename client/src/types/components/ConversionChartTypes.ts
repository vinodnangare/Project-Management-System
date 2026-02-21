export interface ConversionData {
  date: string;
  conversions: number;
  rate?: number;
}

export interface ConversionChartProps {
  data: ConversionData[];
  isLoading?: boolean;
  title?: string;
}

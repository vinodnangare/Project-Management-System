import React from 'react';
// @ts-ignore: If recharts is not installed, install it with npm install recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import '../styles/components/FunnelChart.css';
import type { FunnelData, FunnelChartProps } from '../types/components/FunnelChartTypes';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

const FunnelChart: React.FC<FunnelChartProps> = ({
  data,
  isLoading = false,
  title = 'Lead Funnel',
}) => {
  if (isLoading) {
    return (
      <div className="funnel-chart-container">
        {title && <h3 className="chart-title">{title}</h3>}
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Loading chart...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="funnel-chart-container">
        {title && <h3 className="chart-title">{title}</h3>}
        <div className="chart-empty">
          <p>📊 No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="funnel-chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" stroke="#64748b" />
          <YAxis
            dataKey="stage"
            type="category"
            stroke="#64748b"
            tick={{ fontSize: 14 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            formatter={(value: number | undefined, name: string | undefined, props: any) => {
              const percentage = props.payload.percentage;
              return [
                `${value || 0} leads${percentage ? ` (${percentage.toFixed(1)}%)` : ''}`,
                'Count',
              ];
            }}
          />
          <Bar dataKey="count" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FunnelChart;
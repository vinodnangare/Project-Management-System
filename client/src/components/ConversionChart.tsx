import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/components/ConversionChart.css';

interface ConversionData {
  date: string;
  conversions: number;
  rate?: number;
}

interface ConversionChartProps {
  data: ConversionData[];
  isLoading?: boolean;
  title?: string;
}

const ConversionChart: React.FC<ConversionChartProps> = ({
  data,
  isLoading = false,
  title = 'Conversion Trend',
}) => {
  if (isLoading) {
    return (
      <div className="conversion-chart-container">
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
      <div className="conversion-chart-container">
        {title && <h3 className="chart-title">{title}</h3>}
        <div className="chart-empty">
          <p>📈 No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="conversion-chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            formatter={(value: number | undefined, name: string | undefined) => {
              if (name === 'conversions') {
                return [`${value || 0} leads`, 'Conversions'];
              }
              return [`${value || 0}%`, 'Rate'];
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="line"
            wrapperStyle={{ fontSize: '14px' }}
          />
          <Line
            type="monotone"
            dataKey="conversions"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4, fill: '#3b82f6' }}
            activeDot={{ r: 6 }}
            name="Conversions"
          />
          {data.some(d => d.rate !== undefined) && (
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4, fill: '#10b981' }}
              activeDot={{ r: 6 }}
              name="Rate (%)"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConversionChart;
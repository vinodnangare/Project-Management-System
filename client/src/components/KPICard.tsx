import React from 'react';
import '../styles/components/KPICard.css';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: string;
  color?: string;
  subtitle?: string;
  isLoading?: boolean;
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  icon,
  color = '#3b82f6',
  subtitle,
  isLoading = false,
  onClick,
}) => {
  const getChangeIcon = () => {
    if (!change) return null;
    return change.type === 'increase' ? '↑' : '↓';
  };

  const getChangeColor = () => {
    if (!change) return '';
    return change.type === 'increase' ? '#10b981' : '#ef4444';
  };

  if (isLoading) {
    return (
      <div className="kpi-card loading">
        <div className="kpi-skeleton-icon"></div>
        <div className="kpi-skeleton-text"></div>
        <div className="kpi-skeleton-value"></div>
      </div>
    );
  }

  return (
    <div
      className={`kpi-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{ borderTopColor: color }}
    >
      <div className="kpi-header">
        <div className="kpi-title-section">
          {icon && (
            <div className="kpi-icon" style={{ backgroundColor: color }}>
              {icon}
            </div>
          )}
          <h3 className="kpi-title">{title}</h3>
        </div>
        {change && (
          <div className="kpi-change" style={{ color: getChangeColor() }}>
            <span className="change-icon">{getChangeIcon()}</span>
            <span className="change-value">{Math.abs(change.value)}%</span>
          </div>
        )}
      </div>

      <div className="kpi-content">
        <div className="kpi-value">{value}</div>
        {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
};

export default KPICard;
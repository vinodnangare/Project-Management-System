import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  colorClass: string;
  unit?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, colorClass, unit }) => (
  <div className={`stat-card ${colorClass}`}>
    <div>
      <p className="card-label">{label}</p>
      <p className="card-value">
        {value}
        {unit && <span className="card-unit"> {unit}</span>}
      </p>
    </div>
    <span className="card-icon">{icon}</span>
  </div>
);

export default StatCard;

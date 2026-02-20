import React from 'react';
import type { StatCardProps } from '../types/components/StatCardProps';

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

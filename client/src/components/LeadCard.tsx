import React from 'react';
import '../styles/components/LeadCard.css';
import type { Lead } from '../types/components/Lead';
import type { LeadCardProps } from '../types/components/LeadCardProps';

const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onClick,
  onStageChange,
  draggable = false,
  onDragStart,
  onDragEnd,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      className="lead-card"
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="card-header">
        <h4 className="card-title">{lead.company_name}</h4>
        <span
          className="priority-badge"
          style={{ backgroundColor: getPriorityColor(lead.priority) }}
        >
          {lead.priority}
        </span>
      </div>

      <div className="card-content">
        <div className="card-info-row">
          <span className="info-icon">👤</span>
          <span className="info-text">{lead.contact_name}</span>
        </div>

        <div className="card-info-row">
          <span className="info-icon">📧</span>
          <span className="info-text email">{lead.email}</span>
        </div>

        {lead.phone && (
          <div className="card-info-row">
            <span className="info-icon">📞</span>
            <span className="info-text">{lead.phone}</span>
          </div>
        )}

        <div className="card-info-row">
          <span className="info-icon">📍</span>
          <span className="info-text capitalize">{lead.source}</span>
        </div>
      </div>

      <div className="card-footer">
        <div className="footer-left">
          <span className="owner-badge">
            {lead.owner_name ? `👤 ${lead.owner_name}` : '⚪ Unassigned'}
          </span>
        </div>
        <div className="footer-right">
          <span className="date-text">{formatDate(lead.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
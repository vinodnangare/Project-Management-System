import React from 'react';
import '../styles/components/LeadTimeline.css';

interface TimelineEvent {
  id: string;
  type: 'created' | 'stage_change' | 'note' | 'email' | 'call' | 'meeting' | 'updated';
  title: string;
  description?: string;
  user_name?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface LeadTimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
}

const LeadTimeline: React.FC<LeadTimelineProps> = ({ events, isLoading }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created': return '✨';
      case 'stage_change': return '🎯';
      case 'note': return '📝';
      case 'email': return '📧';
      case 'call': return '📞';
      case 'meeting': return '👥';
      case 'updated': return '✏️';
      default: return '📌';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'created': return '#10b981';
      case 'stage_change': return '#3b82f6';
      case 'note': return '#8b5cf6';
      case 'email': return '#f59e0b';
      case 'call': return '#06b6d4';
      case 'meeting': return '#ec4899';
      case 'updated': return '#6b7280';
      default: return '#94a3b8';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="timeline-loading">
        <div className="loading-spinner"></div>
        <p>Loading timeline...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="timeline-empty">
        <p>📊 No activity yet</p>
        <p className="empty-subtitle">Timeline will show all lead interactions and changes</p>
      </div>
    );
  }

  return (
    <div className="lead-timeline">
      {events.map((event, index) => (
        <div key={event.id} className="timeline-item">
          <div
            className="timeline-marker"
            style={{ backgroundColor: getEventColor(event.type) }}
          >
            {getEventIcon(event.type)}
          </div>

          <div className="timeline-content">
            <div className="timeline-header">
              <h4 className="timeline-title">{event.title}</h4>
              <span className="timeline-timestamp">{formatTimestamp(event.timestamp)}</span>
            </div>

            {event.description && (
              <p className="timeline-description">{event.description}</p>
            )}

            {event.user_name && (
              <div className="timeline-user">
                <span className="user-icon">👤</span>
                <span className="user-name">{event.user_name}</span>
              </div>
            )}

            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className="timeline-metadata">
                {Object.entries(event.metadata).map(([key, value]) => (
                  <span key={key} className="metadata-item">
                    <strong>{key}:</strong> {String(value)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {index < events.length - 1 && <div className="timeline-line" />}
        </div>
      ))}
    </div>
  );
};

export default LeadTimeline;
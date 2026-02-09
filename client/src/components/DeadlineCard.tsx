import React from 'react';

interface DeadlineCardProps {
  index: number;
  title: string;
  dueDate: Date;
  priority: string;
  onSelect?: (taskId: string) => void;
}

export const DeadlineCard: React.FC<DeadlineCardProps> = ({ 
  index, 
  title, 
  dueDate, 
  priority 
}) => {
  const today = new Date();
  const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const badgeClass = `badge-${priority.toLowerCase()}`;
  
  const daysLeftText = daysLeft > 1 ? `${daysLeft} days left` : daysLeft === 1 ? 'Tomorrow' : 'Today';

  return (
    <article className="deadline-card">
      <div className="deadline-left">
        <div className="deadline-number">{index + 1}</div>
        <div>
          <p className="deadline-title">{title}</p>
          <p className="deadline-meta">
            📅 {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            <span className="dot" />
            {daysLeftText}
          </p>
        </div>
      </div>
      <span className={`priority-badge ${badgeClass}`}>{priority}</span>
    </article>
  );
};

export default DeadlineCard;

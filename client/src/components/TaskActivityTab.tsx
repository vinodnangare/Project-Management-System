import React from 'react';
import { formatIST } from '../utils/formatters';
import type { TaskActivityTabProps } from '../types/components/TaskActivityTabProps';

const getActivityActionText = (action: string): string => {
  const actionMap: { [key: string]: string } = {
    'CREATED': 'created this task',
    'STATUS_CHANGED': 'changed status',
    'PRIORITY_CHANGED': 'changed priority',
    'ASSIGNED': 'assigned',
    'UNASSIGNED': 'unassigned',
    'COMMENTED': 'commented',
    'TITLE_CHANGED': 'changed title',
    'DESCRIPTION_CHANGED': 'changed description',
    'DUE_DATE_CHANGED': 'changed due date',
    'DELETED': 'deleted',
    'SUBTASK_UPDATED': 'updated subtask'
  };
  return actionMap[action] || action.toLowerCase().replace('_', ' ');
};

export const TaskActivityTab: React.FC<TaskActivityTabProps> = ({ activities }) => {
  const filteredActivities = activities.filter((activity: any) => activity.action !== 'CREATED');

  return (
    <div className="activity-section">
      {filteredActivities.length === 0 ? (
        <div className="empty-state">No activities yet</div>
      ) : (
        <div className="activity-timeline">
          {filteredActivities.map((activity: any) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-dot"></div>
              <div className="activity-content">
                <div className="activity-action">
                  <strong>
                    {activity.performed_by_user?.full_name || activity.performed_by_user?.email || activity.performed_by_name || activity.performed_by_email || activity.performed_by}
                  </strong> {getActivityActionText(activity.action)}
                </div>
                {activity.old_value && activity.new_value && (
                  <div className="activity-change">
                    <span className="old-value">{activity.old_value}</span>
                    <span className="arrow">→</span>
                    <span className="new_value">{activity.new_value}</span>
                  </div>
                )}
                <div className="activity-timestamp">
                  {formatIST(activity.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

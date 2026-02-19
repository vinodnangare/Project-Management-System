import React from 'react';      

interface TaskStatusControlProps {
  currentStatus: string;
  isAdmin: boolean;
  isAssignedToUser: boolean;
  isUpdating: boolean;
  onStatusChange: (status: string) => void;
}

const STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

export const TaskStatusControl: React.FC<TaskStatusControlProps> = ({
  currentStatus,
  isAdmin,
  isAssignedToUser,
  isUpdating,
  onStatusChange
}) => {
  if (!isAdmin && !isAssignedToUser) return null;

  // Admin has full control
  if (isAdmin) {
    return (
      <div className="status-control admin-control">
        <label>Change Status:</label>
        <select
          value={currentStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          disabled={isUpdating}
          className="status-dropdown"
        >
          {STATUSES.map(status => (
            <option key={status} value={status}>
              {status.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Employee has limited control
  return (
    <div className="status-control employee-control">
      {currentStatus === 'TODO' && (
        <button
          onClick={() => onStatusChange('IN_PROGRESS')}
          disabled={isUpdating}
          className="status-btn start-btn"
        >
          ▶️ Start
        </button>
      )}
      {currentStatus === 'IN_PROGRESS' && (
        <button
          disabled={true}
          className="status-btn disabled-btn"
          title="Complete all subtasks to mark for review"
        >
          In Progress - Complete subtasks to mark for review
        </button>
      )}
      {currentStatus === 'REVIEW' && (
        <button
          disabled={true}
          className="status-btn disabled-btn"
          title="Admin approval required"
        >
          Awaiting Admin Approval
        </button>
      )}
    </div>
  );
};

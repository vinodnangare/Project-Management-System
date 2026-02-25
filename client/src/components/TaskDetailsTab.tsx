import React from 'react';
import { HiOutlineTrash, HiOutlineClock } from 'react-icons/hi';
import type { TaskDetailsTabProps } from '../types/components/TaskDetailsTabProps';

export const TaskDetailsTab: React.FC<TaskDetailsTabProps> = ({
  task,
  assignees,
  availableUsers,
  user,
  isAdmin,
  onAddAssignee,
  onRemoveAssignee,
  statusControl
}) => {
  return (
    <div className="details-section">
      <div className="detail-group status-group">
        <label>Status</label>
        <div className="status-display">
          <span className={`status-badge ${task.status.toLowerCase()}`}>
            {task.status}
          </span>
          {statusControl}
        </div>
      </div>
      
      <div className="detail-group">
        <label>Priority</label>
        <div className="detail-value">{task.priority}</div>
      </div>
      
      <div className="detail-group assignees-group">
        <label>Assigned To</label>
        <div className="assignees-list">
          {assignees.length === 0 ? (
            <div className="no-assignees">No assignees yet</div>
          ) : (
            assignees.map((assignee) => (
              <div key={assignee.id} className="assignee-item">
                <span className="assignee-name">{assignee.full_name || assignee.email}</span>
                {isAdmin && (
                  <button
                    className="remove-assignee-btn"
                    onClick={() => onRemoveAssignee(assignee.id)}
                    title="Remove assignee"
                  >
                    <HiOutlineTrash />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        {isAdmin && (
          <div className="add-assignee-group">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onAddAssignee(e.target.value);
                  e.target.value = '';
                }
              }}
              className="assignee-select"
            >
              <option value="">+ Add Team Member</option>
              {availableUsers
                .filter(u => !assignees.some(a => a.id === u.id))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email})
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>
      
      {task.due_date && (
        <div className="detail-group">
          <label>Due Date</label>
          <div className="detail-value">
            {new Date(task.due_date).toLocaleDateString()}
          </div>
        </div>
      )}
      
      {task.estimated_hours && (
        <div className="detail-group">
          <label>Estimated Hours</label>
          <div className="detail-value"><HiOutlineClock className="detail-icon" /> {task.estimated_hours}h</div>
        </div>
      )}
      
      {task.description && (
        <div className="detail-group">
          <label>Description</label>
          <div className="detail-value description">{task.description}</div>
        </div>
      )}
    </div>
  );
};

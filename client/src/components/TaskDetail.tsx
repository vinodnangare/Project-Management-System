import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchTaskById, fetchComments, addTaskComment, fetchActivities, updateTask, deleteTask } from '../store/thunks';
import { setSelectedTask } from '../store/slices/uiSlice';
import apiClient from '../api/client';
import '../styles/TaskDetail.css';

/**
 * TaskDetail Component
 * Displays full task information with comments and activity log
 */

const STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

export const TaskDetail: React.FC<{ taskId: string }> = ({ taskId }) => {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((state) => state.tasks);
  const comments = useAppSelector((state) => state.comments);
  const activities = useAppSelector((state) => state.activities);
  const { user } = useAppSelector((state) => state.auth);
  
  const selectedTask = tasks.items.find((task: any) => task.id === taskId);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');
  const [newComment, setNewComment] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [assignees, setAssignees] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loadingAssignees, setLoadingAssignees] = useState(false);

  // Load task details, comments, activities, and assignees when taskId changes
  useEffect(() => {
    if (taskId) {
      dispatch(fetchTaskById(taskId));
      dispatch(fetchComments(taskId));
      dispatch(fetchActivities(taskId));
      loadAssignees();
      loadAvailableUsers();
    }
  }, [taskId, dispatch]);

  const loadAssignees = async () => {
    try {
      setLoadingAssignees(true);
      const response = await apiClient.getTaskAssignees(taskId);
      setAssignees(response.data?.data || []);
    } catch (error) {
      console.error('Error loading assignees:', error);
    } finally {
      setLoadingAssignees(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await apiClient.getAssignableUsers();
      setAvailableUsers(response.data?.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddAssignee = async (userId: string) => {
    if (!user || user.role !== 'admin') return;
    
    try {
      const response = await apiClient.addTaskAssignee(taskId, userId);
      setAssignees(response.data?.data || []);
    } catch (error) {
      console.error('Error adding assignee:', error);
    }
  };

  const handleRemoveAssignee = async (userId: string) => {
    if (!user || user.role !== 'admin') return;
    
    try {
      const response = await apiClient.removeTaskAssignee(taskId, userId);
      setAssignees(response.data?.data || []);
    } catch (error) {
      console.error('Error removing assignee:', error);
    }
  };

  if (tasks.loading && !selectedTask) {
    return <div className="task-detail-container"><div className="loading">Loading...</div></div>;
  }

  if (!selectedTask) {
    return (
      <div className="task-detail-container">
        <div className="empty-state">Select a task to view details</div>
      </div>
    );
  }

  const handleAddComment = async () => {
    if (newComment.trim() && user) {
      dispatch(addTaskComment({
        taskId,
        comment: newComment,
        createdBy: user.id
      }));
      setNewComment('');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user || isUpdatingStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      await dispatch(updateTask({
        taskId,
        updates: { status: newStatus },
        performedBy: user.id
      }));
      // Refresh task, activities, and comments after update
      dispatch(fetchTaskById(taskId));
      dispatch(fetchActivities(taskId));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!user) return;
    
    try {
      await dispatch(deleteTask({ taskId, performedBy: user.id }));
      dispatch(setSelectedTask(null)); // Clear selection after delete
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getStatusActionButtons = () => {
    if (!user) return null;
    
    const currentStatus = selectedTask.status;
    const isAssignedToMe = selectedTask.assigned_to === user.id || assignees.some(a => a.id === user.id);
    const isAdmin = user.role === 'admin';

    // Employees can only update tasks assigned to them
    if (!isAdmin && !isAssignedToMe) return null;

    if (isAdmin) {
      // Admin gets full dropdown control with all possible statuses
      return (
        <div className="status-control admin-control">
          <label>Change Status:</label>
          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isUpdatingStatus}
            className="status-dropdown"
          >
            {STATUSES.map(status => (
              <option key={status} value={status}>{status.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      );
    }

    // Employee gets action buttons based on current status
    return (
      <div className="status-control employee-control">
        {currentStatus === 'TODO' && (
          <button
            onClick={() => handleStatusChange('IN_PROGRESS')}
            disabled={isUpdatingStatus}
            className="status-btn start-btn"
          >
            ▶️ Start Work
          </button>
        )}
        {currentStatus === 'IN_PROGRESS' && (
          <button
            onClick={() => handleStatusChange('REVIEW')}
            disabled={isUpdatingStatus}
            className="status-btn review-btn"
          >
            👁️ Submit for Review
          </button>
        )}
        {currentStatus === 'REVIEW' && (
          <button
            onClick={() => handleStatusChange('DONE')}
            disabled={isUpdatingStatus}
            className="status-btn done-btn"
          >
            ✅ Mark as Done
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="task-detail-container">
      <div className="task-detail-header">
        <div className="header-title-row">
          <h1>{selectedTask.title}</h1>
          {user?.role === 'admin' && (
            <button 
              className="delete-btn"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete Task"
            >
              🗑️ Delete
            </button>
          )}
        </div>
        <div className="task-meta">
          <span>Created: {new Date(selectedTask.created_at).toLocaleDateString()}</span>
          <span>
            By: {selectedTask.created_by_name || selectedTask.created_by_email || selectedTask.created_by}
          </span>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={`tab ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          Comments ({comments.items.length})
        </button>
        <button
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity ({activities.items.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'details' && (
          <div className="details-section">
            <div className="detail-group status-group">
              <label>Status</label>
              <div className="status-display">
                <span className={`status-badge ${selectedTask.status.toLowerCase()}`}>
                  {selectedTask.status}
                </span>
                {getStatusActionButtons()}
              </div>
            </div>
            <div className="detail-group">
              <label>Priority</label>
              <div className="detail-value">{selectedTask.priority}</div>
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
                      {user?.role === 'admin' && (
                        <button
                          className="remove-assignee-btn"
                          onClick={() => handleRemoveAssignee(assignee.id)}
                          title="Remove assignee"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
              {user?.role === 'admin' && (
                <div className="add-assignee-group">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddAssignee(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    disabled={loadingAssignees}
                    className="assignee-select"
                  >
                    <option value="">+ Add Team Member</option>
                    {availableUsers
                      .filter(u => !assignees.some(a => a.id === u.id))
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name} ({user.email})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
            {selectedTask.due_date && (
              <div className="detail-group">
                <label>Due Date</label>
                <div className="detail-value">
                  {new Date(selectedTask.due_date).toLocaleDateString()}
                </div>
              </div>
            )}
            {selectedTask.estimated_hours && (
              <div className="detail-group">
                <label>Estimated Hours</label>
                <div className="detail-value">⏰ {selectedTask.estimated_hours}h</div>
              </div>
            )}
            {selectedTask.description && (
              <div className="detail-group">
                <label>Description</label>
                <div className="detail-value description">{selectedTask.description}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="comments-section">
            <div className="add-comment">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
              />
              <button onClick={handleAddComment} disabled={!newComment.trim() || comments.loading}>
                {comments.loading ? 'Posting...' : 'Post Comment'}
              </button>
            </div>

            <div className="comments-list">
              {comments.items.length === 0 ? (
                <div className="empty-state">No comments yet</div>
              ) : (
                comments.items.map((comment: any) => (
                  <div key={comment.id} className="comment">
                    <div className="comment-header">
                      <strong>
                        {comment.created_by_name || comment.created_by_email || comment.created_by}
                      </strong>
                      <span className="timestamp">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p>{comment.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-section">
            {activities.items.length === 0 ? (
              <div className="empty-state">No activities yet</div>
            ) : (
              <div className="activity-timeline">
                {activities.items.map((activity: any) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-dot"></div>
                    <div className="activity-content">
                      <div className="activity-action">
                        <strong>
                          {activity.performed_by_name || activity.performed_by_email || activity.performed_by}
                        </strong> {activity.action.toLowerCase()}
                      </div>
                      {activity.old_value && activity.new_value && (
                        <div className="activity-change">
                          <span className="old-value">{activity.old_value}</span>
                          <span className="arrow">→</span>
                          <span className="new-value">{activity.new_value}</span>
                        </div>
                      )}
                      <div className="activity-timestamp">
                        {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete the task "{selectedTask.title}"?</p>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="confirmation-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-delete"
                onClick={handleDeleteTask}
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;

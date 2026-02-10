import React, { useState } from 'react';
import { useGetSubtasksQuery, useCreateSubtaskMutation, useUpdateSubtaskStatusMutation, useDeleteSubtaskMutation } from '../services/api';
import '../styles/Subtasks.css';
/*This component handles:*/

export const Subtasks: React.FC<{ taskId: string; taskStatus: string }> = ({ taskId, taskStatus }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { data: subtasksData = [], isLoading: loading } = useGetSubtasksQuery(taskId, {
    skip: !taskId,
    refetchOnMountOrArgChange: true,
  });
  const [createSubtask] = useCreateSubtaskMutation();
  const [updateSubtaskStatus] = useUpdateSubtaskStatusMutation();
  const [deleteSubtaskMut] = useDeleteSubtaskMutation();
  
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDescription, setNewSubtaskDescription] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle.trim() || !user?.id) return;

    try {
      await createSubtask({
        taskId,
        title: newSubtaskTitle.trim(),
        description: newSubtaskDescription?.trim() || null,
        created_by: user.id
      }).unwrap();
      setNewSubtaskTitle('');
      setNewSubtaskDescription('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create subtask:', error);
    }
  };

  const handleToggleSubtaskStatus = async (subtask: any) => {
    const isCompleted = subtask.status === 'DONE';
    const nextStatus = isCompleted ? 'TODO' : 'DONE';
    try {
      await updateSubtaskStatus({
        taskId,
        subtaskId: subtask.id,
        status: nextStatus
      }).unwrap();
    } catch (error) {
      console.error('Failed to update subtask:', error);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (window.confirm('Are you sure you want to delete this subtask?')) {
      try {
        await deleteSubtaskMut({ taskId, subtaskId }).unwrap();
      } catch (error) {
        console.error('Failed to delete subtask:', error);
      }
    }
  };

  const isTaskInProgress = taskStatus === 'IN_PROGRESS';
  const canEditSubtasks = user?.role === 'admin' || isTaskInProgress;

  const filteredSubtasks = subtasksData.filter(
    (s: any) => s?.task_id === taskId || s?.taskId === taskId
  );
  const completedCount = filteredSubtasks.filter((s: any) => s.status === 'DONE').length;
  const totalCount = filteredSubtasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="subtasks-container">
      <div className="subtasks-header">
        <h3>Subtasks</h3>
        <div className="subtasks-stats">
          <span className="stat-text">
            {completedCount}/{totalCount} completed
          </span>
          {totalCount > 0 && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {!isTaskInProgress && user?.role !== 'admin' && subtasksData.length > 0 && (
        <div className="info-message">
          Click "Start" button to begin work on this task and mark subtasks as complete.
        </div>
      )}

      {loading ? (
        <div className="loading">Loading subtasks...</div>
      ) : filteredSubtasks.length === 0 ? (
        <div className="empty-state">No subtasks yet. Add one to break down this task.</div>
      ) : (
        <div className="subtasks-list">
          {filteredSubtasks.map((subtask: any) => (
            <div key={subtask.id} className={`subtask-item ${subtask.status === 'DONE' ? 'completed' : ''}`}>
              <div className="subtask-checkbox">
                <input
                  type="checkbox"
                  checked={subtask.status === 'DONE'}
                  onChange={() => handleToggleSubtaskStatus(subtask)}
                  disabled={loading || !canEditSubtasks}
                  title={!canEditSubtasks ? 'Click Start to begin work' : ''}
                />
              </div>
              
              <div className="subtask-content">
                <div className="subtask-title">
                  {subtask.title}
                </div>
                {subtask.description && (
                  <div className="subtask-description">{subtask.description}</div>
                )}
                <div className="subtask-meta">
                  <span className="created-by">
                    By {subtask.created_by_user?.full_name || subtask.created_by_user?.email || subtask.created_by}
                  </span>
                  <span className="created-date">
                    {new Date(subtask.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {user?.role === 'admin' && (
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteSubtask(subtask.id)}
                  disabled={loading}
                  title="Delete subtask"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {user?.role === 'admin' && (
        !showAddForm ? (
          <button 
            className="add-subtask-btn"
            onClick={() => setShowAddForm(true)}
          >
            + Add Subtask
          </button>
        ) : (
        <div className="add-subtask-form">
          <input
            type="text"
            placeholder="Subtask title..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            className="subtask-title-input"
          />
          <textarea
            placeholder="Description (optional)"
            value={newSubtaskDescription}
            onChange={(e) => setNewSubtaskDescription(e.target.value)}
            className="subtask-description-input"
          />
          <div className="form-actions">
            <button
              className="save-btn"
              onClick={handleCreateSubtask}
              disabled={!newSubtaskTitle.trim() || loading}
            >
              {loading ? 'Creating...' : 'Create Subtask'}
            </button>
            <button
              className="cancel-btn"
              onClick={() => {
                setShowAddForm(false);
                setNewSubtaskTitle('');
                setNewSubtaskDescription('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
        )
      )}
    </div>
  );
};
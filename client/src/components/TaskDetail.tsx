import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useGetTaskByIdQuery,
  useGetTaskCommentsQuery,
  useGetTaskActivitiesQuery,
  useGetTaskAssigneesQuery,
  useGetAssignableUsersQuery,
  useAddCommentMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useAddTaskAssigneeMutation,
  useRemoveTaskAssigneeMutation
} from '../services/api';
import { setSelectedTask } from '../store/slices/uiSlice';
import { useAppDispatch } from '../hooks/redux';
import { Subtasks } from './Subtasks';
import { TaskDetailsTab } from './TaskDetailsTab';
import { TaskCommentsTab } from './TaskCommentsTab';
import { TaskActivityTab } from './TaskActivityTab';
import { TaskDocsTab } from './TaskDocsTab';
import { TaskStatusControl } from './TaskStatusControl';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { HiOutlineTrash, HiOutlineX } from 'react-icons/hi';
import '../styles/TaskDetail.css';

interface TaskDetailProps {
  taskId: string;
  onClose?: () => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ taskId, onClose }) => {
  const dispatch = useAppDispatch();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Fetch task details
  const { data: selectedTask, isLoading: taskLoading } = useGetTaskByIdQuery(taskId);
  const { data: comments = [] } = useGetTaskCommentsQuery(taskId);
  const { data: activities = [] } = useGetTaskActivitiesQuery(taskId);
  const { data: assignees = [] } = useGetTaskAssigneesQuery(taskId);
  const { data: availableUsers = [] } = useGetAssignableUsersQuery();
  
  // Mutations
  const [addComment, { isLoading: isAddingComment }] = useAddCommentMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [addAssignee] = useAddTaskAssigneeMutation();
  const [removeAssignee] = useRemoveTaskAssigneeMutation();
  
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'docs' | 'comments' | 'activity'>('details');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  
  const handleAddComment = async (comment: string) => {
    if (user?.id) {
      await addComment({ taskId, comment, created_by: user.id }).unwrap();
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user?.id || isUpdatingStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      await updateTask({
        id: taskId,
        updates: { status: newStatus },
        performedBy: user.id
      }).unwrap();
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!user?.id) return;
    
    try {
      await deleteTask({ id: taskId, performedBy: user.id }).unwrap();
      dispatch(setSelectedTask(null));
      setShowDeleteConfirm(false);
      toast.success('Task deleted');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleAddAssignee = async (userId: string) => {
    if (user?.role !== 'admin') return;
    
    try {
      await addAssignee({ taskId, userId }).unwrap();
    } catch (error) {
      console.error('Error adding assignee:', error);
    }
  };

  const handleRemoveAssignee = async (userId: string) => {
    if (user?.role !== 'admin') return;
    
    try {
      await removeAssignee({ taskId, userId }).unwrap();
    } catch (error) {
      console.error('Error removing assignee:', error);
    }
  };

  if (taskLoading) {
    return <div className="task-detail-container"><div className="loading">Loading...</div></div>;
  }

  if (!selectedTask) {
    return (
      <div className="task-detail-container">
        <div className="empty-state">Select a task to view details</div>
      </div>
    );
  }

  const isAssignedToMe = selectedTask.assigned_to === user.id || assignees.some(a => a.id === user.id);

  return (
    <div className="task-detail-container">
      <div className="task-detail-header">
        <div className="header-title-row">
          <h1>{selectedTask.title}</h1>
          {user?.role === 'admin' && (
            <button 
              className="delete-task-btn"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete Task"
            >
              <HiOutlineTrash className="delete-task-icon" />
              <span className="delete-task-text">Delete Task</span>
            </button>
          )}
        </div>
        <div className="task-meta">
          <span>Created: {new Date(selectedTask.created_at).toLocaleDateString()}</span>
          <span>
            By: {selectedTask.created_by_user?.full_name || selectedTask.created_by_user?.email || selectedTask.created_by_name || selectedTask.created_by_email || selectedTask.created_by}
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
          className={`tab ${activeTab === 'subtasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('subtasks')}
        >
          Subtasks
        </button>
        <button
          className={`tab ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          Docs
        </button>
        <button
          className={`tab ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          Comments ({comments.length})
        </button>
        <button
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity ({Math.max(0, activities.length - 1)})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'details' && (
          <TaskDetailsTab
            task={selectedTask}
            assignees={assignees}
            availableUsers={availableUsers}
            user={user}
            isAdmin={user?.role === 'admin'}
            onAddAssignee={handleAddAssignee}
            onRemoveAssignee={handleRemoveAssignee}
            statusControl={
              <TaskStatusControl
                currentStatus={selectedTask.status}
                isAdmin={user?.role === 'admin'}
                isAssignedToUser={isAssignedToMe}
                isUpdating={isUpdatingStatus}
                onStatusChange={handleStatusChange}
              />
            }
          />
        )}

        {activeTab === 'subtasks' && (
          <div className="subtasks-section">
            <Subtasks taskId={taskId} taskStatus={selectedTask.status} />
          </div>
        )}

        {activeTab === 'docs' && (
          <TaskDocsTab taskId={taskId} isAdmin={user?.role === 'admin'} />
        )}

        {activeTab === 'comments' && (
          <TaskCommentsTab
            comments={comments}
            onAddComment={handleAddComment}
            isAdding={isAddingComment}
          />
        )}

        {activeTab === 'activity' && (
          <TaskActivityTab activities={activities} />
        )}
      </div>

      {onClose && (
        <div className="task-detail-actions">
          <button type="button" onClick={onClose} className="close-detail-btn">
            <HiOutlineX className="btn-icon" /> Close
          </button>
        </div>
      )}

      {showDeleteConfirm && (
        <DeleteConfirmDialog
          title="Confirm Delete"
          message={`Are you sure you want to delete the task "${selectedTask.title}"?`}
          onConfirm={handleDeleteTask}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};

export default TaskDetail;

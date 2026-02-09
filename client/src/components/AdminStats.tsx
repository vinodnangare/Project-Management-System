import { useState } from 'react';
import { useGetTaskStatsQuery, useGetTasksQuery, useDeleteEmployeeMutation } from '../services/api';
import '../styles/AdminStats.css';

export const AdminStats: React.FC = () => {
  const { data: stats, isLoading: loading, error, refetch } = useGetTaskStatsQuery();
  const { data: tasksData } = useGetTasksQuery({ page: 1, limit: 100 });
  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteEmployeeMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string>('');

  const handleRetry = () => {
    refetch();
  };

  const handleDeleteEmployee = async () => {
    if (!deleteConfirm) return;

    setDeletingId(deleteConfirm.id);
    setDeleteError('');
    try {
      await deleteEmployee(deleteConfirm.id).unwrap();
      setDeleteConfirm(null);
      refetch();
    } catch (err: any) {
      setDeleteError(err?.data?.error || 'Failed to delete employee');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="stats-container"><div className="loading">Loading statistics...</div></div>;
  }

  if (error) {
    return (
      <div className="stats-container">
        <div className="error-message">{(error as any)?.data?.message || 'Failed to load statistics'}</div>
        <button onClick={handleRetry} className="retry-btn">Retry</button>
      </div>
    );
  }

  const { overall, employees } = stats || { overall: {}, employees: [] };
  const fallbackTasks = tasksData?.tasks || [];
  const fallbackOverall = {
    total_tasks: fallbackTasks.length,
    todo_tasks: fallbackTasks.filter((t) => t.status === 'TODO').length,
    in_progress_tasks: fallbackTasks.filter((t) => t.status === 'IN_PROGRESS').length,
    review_tasks: fallbackTasks.filter((t) => t.status === 'REVIEW').length,
    done_tasks: fallbackTasks.filter((t) => t.status === 'DONE').length,
  };
  const totalTasks = Number((overall as any)?.total_tasks ?? 0);
  const effectiveOverall = totalTasks > 0 ? overall : fallbackOverall;

  return (
    <div className="stats-container">
      <h2 className="stats-title">📊 Task Management Dashboard</h2>
      <div className="overall-stats">
        <h3>Overall Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-value">{effectiveOverall?.total_tasks || 0}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card todo">
            <div className="stat-value">{effectiveOverall?.todo_tasks || 0}</div>
            <div className="stat-label">To Do</div>
          </div>
          <div className="stat-card in-progress">
            <div className="stat-value">{effectiveOverall?.in_progress_tasks || 0}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card review">
            <div className="stat-value">{effectiveOverall?.review_tasks || 0}</div>
            <div className="stat-label">In Review</div>
          </div>
          <div className="stat-card done">
            <div className="stat-value">{effectiveOverall?.done_tasks || 0}</div>
            <div className="stat-label">Done</div>
          </div>
        </div>
      </div>

      <div className="employee-stats">
        <h3>Employee-wise Task Distribution</h3>
        {!employees || employees.length === 0 ? (
          <div className="no-data">No employee data available</div>
        ) : (
          <div className="employee-table-wrapper">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Employee Name</th>
                  <th>Email</th>
                  <th>Total Tasks</th>
                  <th className="todo">To Do</th>
                  <th className="in-progress">In Progress</th>
                  <th className="review">In Review</th>
                  <th className="done">Done</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp: any) => (
                  <tr key={emp.employee_id} className="employee-row">
                    <td className="employee-photo">
                      <div className="employee-avatar">
                        {emp.profile_image_url ? (
                          <img
                            src={emp.profile_image_url}
                            alt={emp.employee_name}
                            className="employee-avatar-image"
                          />
                        ) : (
                          <span className="employee-avatar-text">
                            {emp.employee_name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="employee-name">{emp.employee_name}</td>
                    <td className="employee-email">{emp.employee_email}</td>
                    <td className="total-col">{emp.total}</td>
                    <td className="todo-col">{emp.todo}</td>
                    <td className="in-progress-col">{emp.in_progress}</td>
                    <td className="review-col">{emp.review}</td>
                    <td className="done-col">{emp.done}</td>
                    <td className="actions-col">
                      <button
                        className="delete-btn"
                        onClick={() => setDeleteConfirm({ id: emp.employee_id, name: emp.employee_name })}
                        disabled={deletingId === emp.employee_id}
                        title="Delete employee"
                      >
                        {deletingId === emp.employee_id ? '⏳' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="stats-summary">
        <p>Total Employees: <strong>{overall?.total_employees || 0}</strong></p>
        <p>Last Updated: <strong>{new Date().toLocaleString()}</strong></p>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>Confirm Delete Employee</h3>
            <p>Are you sure you want to delete the employee <strong>"{deleteConfirm.name}"</strong>?</p>
            <p className="warning-text">This action cannot be undone. The employee will be deactivated and their account will no longer be accessible.</p>
            {deleteError && <div className="error-message">{deleteError}</div>}
            <div className="confirmation-actions">
              <button 
                className="btn-cancel"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="btn-delete"
                onClick={handleDeleteEmployee}
                disabled={isDeleting}
              >
                {isDeleting ? '⏳ Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStats;

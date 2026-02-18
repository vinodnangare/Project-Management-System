import { useState } from 'react';
import toast from 'react-hot-toast';
import { useGetTaskStatsQuery, useGetTasksQuery, useDeleteEmployeeMutation, useRegisterMutation, useGetAssignableUsersQuery } from '../services/api';
import '../styles/AdminStats.css';
import AdminTimeLogs from './AdminTimeLogs'; 
import EmployeeTimeLogModal from './EmployeeTimeLogModal';

export const AdminStats: React.FC = () => {
  const { data: stats, isLoading: loading, error, refetch } = useGetTaskStatsQuery();
  const { data: tasksData } = useGetTasksQuery({ page: 1, limit: 100 });
  const { data: assignableUsers = [] } = useGetAssignableUsersQuery();
  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteEmployeeMutation();
  const [registerEmployee, { isLoading: isRegistering }] = useRegisterMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string>('');
  const [showAddEmployee, setShowAddEmployee] = useState<boolean>(false);
  const [newEmployee, setNewEmployee] = useState({ full_name: '', email: '', password: '', password_confirm: '', role: 'employee' });
  const [registerError, setRegisterError] = useState<string>('');
  const [registerSuccess, setRegisterSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timelogs'>('dashboard');
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);

  const handleRetry = () => {
    refetch();
  };

  const handleDeleteEmployee = async () => {
    if (!deleteConfirm) return;
    if (!deleteConfirm.id) {
      toast.error('Missing employee id for this row');
      return;
    }

    setDeletingId(deleteConfirm.id);
    setDeleteError('');
    try {
      await deleteEmployee(deleteConfirm.id).unwrap();
      setDeleteConfirm(null);
      toast.success('Employee deleted');
      refetch();
    } catch (err: any) {
      const message = err?.data?.error || 'Failed to delete employee';
      setDeleteError(message);
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');

    if (newEmployee.password !== newEmployee.password_confirm) {
      const message = 'Passwords do not match';
      setRegisterError(message);
      toast.error(message);
      return;
    }

    if (newEmployee.password.length < 6) {
      const message = 'Password must be at least 6 characters';
      setRegisterError(message);
      toast.error(message);
      return;
    }

    // Validate role
    if (!newEmployee.role || !['employee', 'manager'].includes(newEmployee.role)) {
      const message = 'Please select a valid role';
      setRegisterError(message);
      toast.error(message);
      return;
    }

    try {
      // Ensure role is cleaned up before sending
      const employeeData = {
        ...newEmployee,
        role: newEmployee.role.trim().toLowerCase() as 'employee' | 'manager'
      };
      await registerEmployee(employeeData).unwrap();
      const successMessage = `Employee ${newEmployee.full_name} added successfully!`;
      setRegisterSuccess(successMessage);
      toast.success(successMessage);
      setNewEmployee({ full_name: '', email: '', password: '', password_confirm: '', role: 'employee' });
      setShowAddEmployee(false);
      refetch();
      setTimeout(() => setRegisterSuccess(''), 3000);
    } catch (err: any) {
      console.error('Registration error:', err);
      const message = err?.data?.error || 'Failed to add employee';
      setRegisterError(message);
      toast.error(message);
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
  const employeeIdByEmail = new Map(
    (assignableUsers || []).map((user: any) => [String(user.email || '').toLowerCase(), user.id])
  );
  const employeeIdByName = new Map(
    (assignableUsers || []).map((user: any) => [String(user.full_name || '').toLowerCase(), user.id])
  );
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
      <div className="admin-tabs">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={activeTab === 'timelogs' ? 'active' : ''}
          onClick={() => setActiveTab('timelogs')}
        >
          ⏱️ Time Logs
        </button>
      </div>
      {activeTab === 'dashboard' ? (
        <>
          <h2 className="stats-title">📊 Task Management Dashboard</h2>
          {registerSuccess && <div className="success-message">{registerSuccess}</div>}
          {/* Add Employee Section */}
          <div className="add-employee-section">
            <div className="section-header">
              <h3>👥 Employee Management</h3>
              <button
                className="btn-add-employee"
                onClick={() => setShowAddEmployee(!showAddEmployee)}
              >
                {showAddEmployee ? '✕ Cancel' : '➕ Add New Employee'}
              </button>
            </div>
            {showAddEmployee && (
              <form className="add-employee-form" onSubmit={handleAddEmployee}>
                {registerError && <div className="error-message">{registerError}</div>}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="full_name">Full Name</label>
                    <input
                      type="text"
                      id="full_name"
                      value={newEmployee.full_name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                      required
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                      required
                      placeholder="Enter email"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      value={newEmployee.password}
                      onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                      required
                      placeholder="Enter password (min 6 characters)"
                      minLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="password_confirm">Confirm Password</label>
                    <input
                      type="password"
                      id="password_confirm"
                      value={newEmployee.password_confirm}
                      onChange={(e) => setNewEmployee({ ...newEmployee, password_confirm: e.target.value })}
                      required
                      placeholder="Re-enter password"
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="role">Role</label>
                    <select
                      id="role"
                      value={newEmployee.role}
                      onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                      required
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn-submit-employee" disabled={isRegistering}>
                  {isRegistering ? '⏳ Adding...' : '✓ Add Employee'}
                </button>
              </form>
            )}
          </div>
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
                    {employees.map((emp: any) => {
                      const emailKey = String(emp.employee_email || '').trim().toLowerCase();
                      const nameKey = String(emp.employee_name || '').trim().toLowerCase();
                      const employeeId = emp.employee_id || emp.id || employeeIdByEmail.get(emailKey) || employeeIdByName.get(nameKey) || emailKey || '';
                      return (
                        <tr
                          key={employeeId || emp.employee_email}
                          className="employee-row"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedEmployee({ id: employeeId, name: emp.employee_name })}
                        >
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
                              onClick={e => {
                                e.stopPropagation();
                                setDeleteConfirm({ id: employeeId, name: emp.employee_name });
                              }}
                              disabled={!employeeId || deletingId === employeeId}
                              title={employeeId ? 'Delete employee' : 'Missing employee id'}
                            >
                              {deletingId === employeeId ? '⏳' : '🗑️'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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
        {selectedEmployee && (
          <EmployeeTimeLogModal
            employeeId={selectedEmployee.id}
            employeeName={selectedEmployee.name}
            open={!!selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
          />
        )}
        </>
      ) : (
        <AdminTimeLogs />
      )}
    </div>
  );
};

export default AdminStats;

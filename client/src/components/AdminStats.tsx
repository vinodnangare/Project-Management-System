import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import '../styles/AdminStats.css';

interface EmployeeStats {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  todo: number;
  in_progress: number;
  review: number;
  done: number;
  total: number;
}

interface OverallStats {
  total_tasks: number;
  todo_tasks: number;
  in_progress_tasks: number;
  review_tasks: number;
  done_tasks: number;
  total_employees: number;
}

export const AdminStats: React.FC = () => {
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.getTaskStats();
      setOverallStats(response.data.data.overall);
      setEmployeeStats(response.data.data.employees);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch statistics');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="stats-container"><div className="loading">Loading statistics...</div></div>;
  }

  if (error) {
    return (
      <div className="stats-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchStats} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <h2 className="stats-title">📊 Task Management Dashboard</h2>

      {/* Overall Statistics */}
      <div className="overall-stats">
        <h3>Overall Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-value">{overallStats?.total_tasks || 0}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card todo">
            <div className="stat-value">{overallStats?.todo_tasks || 0}</div>
            <div className="stat-label">To Do</div>
          </div>
          <div className="stat-card in-progress">
            <div className="stat-value">{overallStats?.in_progress_tasks || 0}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card review">
            <div className="stat-value">{overallStats?.review_tasks || 0}</div>
            <div className="stat-label">In Review</div>
          </div>
          <div className="stat-card done">
            <div className="stat-value">{overallStats?.done_tasks || 0}</div>
            <div className="stat-label">Done</div>
          </div>
        </div>
      </div>

      {/* Employee-wise Statistics */}
      <div className="employee-stats">
        <h3>Employee-wise Task Distribution</h3>
        {employeeStats.length === 0 ? (
          <div className="no-data">No employee data available</div>
        ) : (
          <div className="employee-table-wrapper">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Email</th>
                  <th>Total Tasks</th>
                  <th className="todo">To Do</th>
                  <th className="in-progress">In Progress</th>
                  <th className="review">In Review</th>
                  <th className="done">Done</th>
                </tr>
              </thead>
              <tbody>
                {employeeStats.map((emp) => (
                  <tr key={emp.employee_id} className="employee-row">
                    <td className="employee-name">{emp.employee_name}</td>
                    <td className="employee-email">{emp.employee_email}</td>
                    <td className="total-col">{emp.total}</td>
                    <td className="todo-col">{emp.todo}</td>
                    <td className="in-progress-col">{emp.in_progress}</td>
                    <td className="review-col">{emp.review}</td>
                    <td className="done-col">{emp.done}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Info */}
      <div className="stats-summary">
        <p>Total Employees: <strong>{overallStats?.total_employees || 0}</strong></p>
        <p>Last Updated: <strong>{new Date().toLocaleString()}</strong></p>
      </div>
    </div>
  );
};

export default AdminStats;

import React, { useState } from 'react';
import { useGetAdminTimeLogsQuery } from '../services/api';
import DatePicker from './DatePicker';
import '../styles/AdminTimeLogs.css';
import type { TimeLog } from '../types/components/AdminTimeLogsTypes';

const AdminTimeLogs: React.FC = () => {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const { data: timeLogs = [], isLoading, error, refetch } = useGetAdminTimeLogsQuery(date);

  return (
    <div className="admin-time-logs premium-glass">
      <header className="atl-header">
        <h1>Employee Time Logs</h1>
        <DatePicker value={date} onChange={setDate} />
      </header>
      {isLoading ? (
        <div className="atl-loading">Loading...</div>
      ) : error ? (
        <div className="atl-error">Error loading time logs.</div>
      ) : (
        <div className="atl-table-wrapper">
          <table className="atl-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Hours</th>
                <th>Task</th>
                <th>Description</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {timeLogs.length === 0 ? (
                <tr><td colSpan={5} className="atl-empty">No logs for this date.</td></tr>
              ) : (
                timeLogs.map((log: TimeLog) => (
                  <tr key={log.id} className="atl-row">
                    <td className="atl-emp">
                      <div className="atl-avatar">{log.full_name[0]}</div>
                      <span>{log.full_name}</span>
                    </td>
                    <td className="atl-hours">{log.hours_worked}h</td>
                    <td>{log.task_id || '-'}</td>
                    <td>{log.description || '-'}</td>
                    <td>{new Date(log.date).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTimeLogs;
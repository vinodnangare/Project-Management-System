import React, { useEffect } from 'react';
import { useGetUserTimeLogsAdminQuery } from '../services/api';
import '../styles/EmployeeTimeLogModal.css';
import type { EmployeeTimeLogModalProps } from '../types/components/EmployeeTimeLogModalProps';

const EmployeeTimeLogModal: React.FC<EmployeeTimeLogModalProps> = ({ employeeId, employeeName, open, onClose }) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];
  const { data: timeLogs = [], isLoading, error, refetch } = useGetUserTimeLogsAdminQuery({ userId: employeeId, startDate, endDate });

  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

  // No need to filter, API returns only this employee's logs
  const employeeLogs = timeLogs;

  if (!open) return null;

  return (
    <div className="etl-modal-overlay">
      <div className="etl-modal premium-glass">
        <button className="etl-close-btn" onClick={onClose}>×</button>
        <h2 className="etl-title">⏱️ {employeeName}'s Time Logs</h2>
        {isLoading ? (
          <div className="etl-loading">Loading...</div>
        ) : error ? (
          <div className="etl-error">Error loading time logs.</div>
        ) : employeeLogs.length === 0 ? (
          <div className="etl-empty">No time logs found for this employee.</div>
        ) : (
          <div className="etl-table-wrapper">
            <table className="etl-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Task</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {employeeLogs.map((log: any) => (
                  <tr key={log.id} className="etl-row">
                    <td>{new Date(log.date).toLocaleDateString()}</td>
                    <td className="etl-hours">{log.hours_worked}h</td>
                    <td>{log.task_title || '-'}</td>
                    <td>{log.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeTimeLogModal;
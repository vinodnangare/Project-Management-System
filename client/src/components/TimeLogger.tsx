import React, { useEffect, useMemo, useState } from 'react';
import { useGetTasksQuery, useGetTimeLogsQuery, useLogTimeMutation } from '../services/api';
import '../styles/TimeLogger.css';

interface TimeLog {
  id: string;
  user_id: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  task_id: string | null;
  hours_worked: number;
  date: string;
  description: string | null;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
}

export const TimeLogger: React.FC = () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: tasksData } = useGetTasksQuery({ page: 1, limit: 100 });
  const { data: timeLogs = [], refetch: refetchTimeLogs } = useGetTimeLogsQuery({
    startDate: thirtyDaysAgo.toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [logTime, { isLoading: loading, error, isSuccess: success }] = useLogTimeMutation();
  
  const tasks = tasksData?.tasks || [];
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hoursWorked, setHoursWorked] = useState('');
  const [taskId, setTaskId] = useState('');
  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');

  useEffect(() => {
    if (success) {
      setLocalSuccess('Time logged successfully');
      setHoursWorked('');
      setTaskId('');
      setDescription('');
      refetchTimeLogs();
      const timer = setTimeout(() => setLocalSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, refetchTimeLogs]);

  useEffect(() => {
    if (error) {
      setLocalError((error as any)?.data?.message || 'Failed to log time');
      const timer = setTimeout(() => setLocalError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setLocalSuccess('');

    if (!hoursWorked || parseFloat(hoursWorked) <= 0) {
      setLocalError('Hours worked must be greater than 0');
      return;
    }

    try {
      await logTime({
        date,
        hours_worked: parseFloat(hoursWorked),
        task_id: taskId || undefined,
        description: description || undefined
      }).unwrap();
    } catch (err) {
      // Error handled by useEffect
    }
  };

  const getTotalHours = () => {
    const total = timeLogs.reduce((sum, log) => sum + Number(log.hours_worked), 0);
    return total.toFixed(1);
  };

  const getWeeklyHours = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const total = timeLogs
      .filter((log) => new Date(log.date) >= sevenDaysAgo)
      .reduce((sum, log) => sum + Number(log.hours_worked), 0);

    return total.toFixed(1);
  };

  const sortedLogs = useMemo(
    () => [...timeLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [timeLogs]
  );

  const formatDay = (dateString: string) => {
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="time-page">
      <header className="time-hero">
        <div>
          <p className="eyebrow">Time & Focus</p>
          <h1>Daily Time Logger</h1>
          <p className="hero-sub">Track what you ship and keep a clean trail of your effort.</p>
        </div>
        <div className="hero-metrics">
          <div className="metric">
            <p className="metric-label">Last 7 days</p>
            <p className="metric-value">{getWeeklyHours()}h</p>
          </div>
          <div className="metric">
            <p className="metric-label">Last 30 days</p>
            <p className="metric-value">{getTotalHours()}h</p>
          </div>
          <div className="metric">
            <p className="metric-label">Entries</p>
            <p className="metric-value">{timeLogs.length}</p>
          </div>
        </div>
      </header>

      <section className="time-grid">
        <article className="panel form-panel">
          <div className="panel-header">
            <h2>Log your time</h2>
            <p className="panel-sub">Capture the date, hours, task, and a short note.</p>
          </div>

          {localError && <div className="alert alert-error">{localError}</div>}
          {localSuccess && <div className="alert alert-success">{localSuccess}</div>}

          <form onSubmit={handleSubmit} className="time-form">
            <div className="form-row">
              <label className="field">
                <span>📅 Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </label>

              <label className="field">
                <span>⏰ Hours</span>
                <input
                  type="number"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  placeholder="8"
                  min="0.5"
                  step="0.5"
                  max="24"
                  required
                />
              </label>
            </div>

            <label className="field">
              <span>📋 Task (optional)</span>
              <select value={taskId} onChange={(e) => setTaskId(e.target.value)}>
                <option value="">No specific task</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>📝 Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you work on today?"
                rows={3}
              />
            </label>

            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? 'Saving…' : '💾 Log Time'}
            </button>
          </form>
        </article>

        <article className="panel history-panel">
          <div className="panel-header">
            <h2>Recent logs</h2>
            <p className="panel-sub">Your last 30 days of work entries.</p>
          </div>

          {sortedLogs.length === 0 ? (
            <div className="empty-block">
              <div className="empty-icon">🕒</div>
              <p>No time logs yet. Start with today’s entry.</p>
            </div>
          ) : (
            <div className="logs-list">
              {sortedLogs.map((log) => (
                <article key={log.id} className="log-card">
                  <div className="log-top">
                    <div>
                      <p className="log-day">{formatDay(log.date)}</p>
                      <p className="log-date">{new Date(log.date).toLocaleDateString()}</p>
                    </div>
                    <span className="hours-pill">{log.hours_worked}h</span>
                  </div>

                  {log.description && <p className="log-description">{log.description}</p>}

                  {log.task_id && (
                    <span className="task-chip">
                      📋 {tasks.find((t) => t.id === log.task_id)?.title || 'Task'}
                    </span>
                  )}
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
};

export default TimeLogger;

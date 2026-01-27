import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../api/client';
import '../styles/TimeLogger.css';

interface TimeLog {
  id: string;
  user_id: string;
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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hoursWorked, setHoursWorked] = useState('');
  const [taskId, setTaskId] = useState('');
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchTimeLogs();
  }, []);

  useEffect(() => {
    fetchTimeLogForDate();
  }, [date]);

  const fetchTasks = async () => {
    try {
      const response = await apiClient.getTasks(1, 100);
      setTasks(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const fetchTimeLogs = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();
      
      const response = await apiClient.getTimeLogs(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      setTimeLogs(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch time logs:', err);
    }
  };

  const fetchTimeLogForDate = async () => {
    try {
      const response = await apiClient.getTimeLogForDate(date);
      if (response.data.data) {
        const log = response.data.data;
        setHoursWorked(log.hours_worked.toString());
        setTaskId(log.task_id || '');
        setDescription(log.description || '');
      } else {
        setHoursWorked('');
        setTaskId('');
        setDescription('');
      }
    } catch (err) {
      // No log for this date yet
      setHoursWorked('');
      setTaskId('');
      setDescription('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!hoursWorked || parseFloat(hoursWorked) <= 0) {
      setError('Please enter valid hours worked');
      return;
    }

    setLoading(true);
    try {
      await apiClient.logTime({
        date,
        hours_worked: parseFloat(hoursWorked),
        task_id: taskId || null,
        description: description || null
      });

      setSuccess('Time logged successfully!');
      fetchTimeLogs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to log time');
    } finally {
      setLoading(false);
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

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

import { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchTasks } from '../store/thunks';
import apiClient from '../api/client';
import '../styles/EmployeeDashboard.css';

interface EmployeeStats {
  totalTasks: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksTodo: number;
  tasksInReview: number;
  tasksOverdue: number;
  tasksDueToday: number;
  hoursWorked: number;
  averageCompletionTime: number;
  completionRate: number;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: string;
  }>;
}

const EmployeeDashboard = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items: tasks } = useAppSelector((state) => state.tasks);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent double loading in React StrictMode
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadStats = async () => {
      try {
        if (!user?.id) return;

        // Fetch tasks first
        await dispatch(fetchTasks({ page: 1, limit: 50 }));
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [dispatch, user?.id]);

  // Separate effect to recalculate stats when tasks change
  useEffect(() => {
    if (!user?.id || tasks.length === 0) return;

    const recalculateStats = async () => {
      try {
        // Calculate stats from tasks
        const userTasks = tasks.filter((task) => task.assigned_to === user.id);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Filter tasks by status
        const completed = userTasks.filter((t) => t.status === 'DONE');
        const inProgress = userTasks.filter((t) => t.status === 'IN_PROGRESS');
        const todo = userTasks.filter((t) => t.status === 'TODO');
        const inReview = userTasks.filter((t) => t.status === 'REVIEW');

        // Calculate overdue tasks
        const overdue = userTasks.filter((t) => {
          if (!t.due_date || t.status === 'DONE') return false;
          return new Date(t.due_date) < today;
        });

        // Calculate tasks due today
        const dueToday = userTasks.filter((t) => {
          if (!t.due_date) return false;
          const dueDate = new Date(t.due_date);
          return (
            dueDate.getFullYear() === today.getFullYear() &&
            dueDate.getMonth() === today.getMonth() &&
            dueDate.getDate() === today.getDate()
          );
        });

        // Get upcoming deadlines (next 7 days)
        const upcoming = userTasks
          .filter((t) => {
            if (!t.due_date || t.status === 'DONE') return false;
            const dueDate = new Date(t.due_date);
            return dueDate > today && dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          })
          .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
          .slice(0, 5)
          .map((t) => ({
            id: t.id,
            title: t.title,
            dueDate: t.due_date!,
            priority: t.priority,
          }));

        // Calculate completion rate
        const completionRate = userTasks.length > 0 ? (completed.length / userTasks.length) * 100 : 0;

        // Fetch hours worked from time logs
        try {
          const response = await apiClient.getTimeLogs(
            new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
            new Date().toISOString().split('T')[0]
          );
          const timeLogs = response.data?.data || [];
          const hoursWorked = timeLogs.reduce(
            (sum: number, log: any) => sum + (Number(log.hours_worked) || 0),
            0
          );

          setStats({
            totalTasks: userTasks.length,
            tasksCompleted: completed.length,
            tasksInProgress: inProgress.length,
            tasksTodo: todo.length,
            tasksInReview: inReview.length,
            tasksOverdue: overdue.length,
            tasksDueToday: dueToday.length,
            hoursWorked: isNaN(hoursWorked) ? 0 : Math.round(hoursWorked * 10) / 10,
            averageCompletionTime: 0,
            completionRate: Math.round(completionRate),
            upcomingDeadlines: upcoming,
          });
        } catch {
          // If time logs fail, just skip that metric
          setStats({
            totalTasks: userTasks.length,
            tasksCompleted: completed.length,
            tasksInProgress: inProgress.length,
            tasksTodo: todo.length,
            tasksInReview: inReview.length,
            tasksOverdue: overdue.length,
            tasksDueToday: dueToday.length,
            hoursWorked: 0,
            averageCompletionTime: 0,
            completionRate: Math.round(completionRate),
            upcomingDeadlines: upcoming,
          });
        }
      } catch (error) {
        console.error('Error recalculating stats:', error);
      }
    };

    recalculateStats();
  }, [user?.id, tasks]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" aria-label="Loading" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-loading">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="employee-dashboard">
      <header className="dashboard-hero">
        <div className="hero-content">
          <div>
            <p className="eyebrow">Employee Overview</p>
            <h1>Dashboard</h1>
            <p className="hero-subtitle">{user?.email}</p>
          </div>
          <div className="hero-summary">
            <div>
              <p className="small-label">Active tasks</p>
              <p className="hero-number">{stats.totalTasks}</p>
            </div>
            <div>
              <p className="small-label">Completion</p>
              <p className="hero-number">{stats.completionRate}%</p>
            </div>
            <div>
              <p className="small-label">Hours</p>
              <p className="hero-number">{stats.hoursWorked}h</p>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="cards-section">
          <div className="stat-card color-blue">
            <div>
              <p className="card-label">Total Tasks</p>
              <p className="card-value">{stats.totalTasks}</p>
            </div>
            <span className="card-icon">📋</span>
          </div>

          <div className="stat-card color-green">
            <div>
              <p className="card-label">Completed</p>
              <p className="card-value">{stats.tasksCompleted}</p>
            </div>
            <span className="card-icon">✅</span>
          </div>

          <div className="stat-card color-purple">
            <div>
              <p className="card-label">In Progress</p>
              <p className="card-value">{stats.tasksInProgress}</p>
            </div>
            <span className="card-icon">⏳</span>
          </div>

          <div className="stat-card color-red">
            <div>
              <p className="card-label">Overdue</p>
              <p className="card-value">{stats.tasksOverdue}</p>
            </div>
            <span className="card-icon">🚨</span>
          </div>

          <div className="stat-card color-orange">
            <div>
              <p className="card-label">Due Today</p>
              <p className="card-value">{stats.tasksDueToday}</p>
            </div>
            <span className="card-icon">📅</span>
          </div>

          <div className="stat-card color-yellow">
            <div>
              <p className="card-label">To Do</p>
              <p className="card-value">{stats.tasksTodo}</p>
            </div>
            <span className="card-icon">📝</span>
          </div>

          <div className="stat-card color-pink">
            <div>
              <p className="card-label">In Review</p>
              <p className="card-value">{stats.tasksInReview}</p>
            </div>
            <span className="card-icon">👀</span>
          </div>

          <div className="stat-card color-indigo">
            <div>
              <p className="card-label">Hours Worked</p>
              <p className="card-value">{stats.hoursWorked}<span className="card-unit"> hrs</span></p>
            </div>
            <span className="card-icon">⏱️</span>
          </div>

          <div className="stat-card color-teal">
            <div>
              <p className="card-label">Completion Rate</p>
              <p className="card-value">{stats.completionRate}<span className="card-unit">%</span></p>
            </div>
            <span className="card-icon">📊</span>
          </div>
        </section>

        {stats.upcomingDeadlines.length > 0 && (
          <section className="deadlines-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Upcoming</p>
                <h2>Deadlines</h2>
              </div>
              <p className="section-subtitle">Next 7 days</p>
            </div>
            <div className="deadlines-list">
              {stats.upcomingDeadlines.map((task, index) => {
                const dueDate = new Date(task.dueDate);
                const today = new Date();
                const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                const badgeClass = `badge-${task.priority.toLowerCase()}`;

                return (
                  <article key={task.id} className="deadline-card">
                    <div className="deadline-left">
                      <div className="deadline-number">{index + 1}</div>
                      <div>
                        <p className="deadline-title">{task.title}</p>
                        <p className="deadline-meta">
                          📅 {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          <span className="dot" />
                          {daysLeft > 1 ? `${daysLeft} days left` : daysLeft === 1 ? 'Tomorrow' : 'Today'}
                        </p>
                      </div>
                    </div>
                    <span className={`priority-badge ${badgeClass}`}>{task.priority}</span>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {stats.totalTasks === 0 && (
          <section className="empty-state">
            <div className="empty-icon">🎉</div>
            <h3>No Tasks Assigned</h3>
            <p>You have no assigned tasks. Enjoy your time or pick a new one!</p>
          </section>
        )}
      </main>
    </div>
  );
};

export default EmployeeDashboard;

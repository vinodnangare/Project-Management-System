import { useMemo } from 'react';
import { useAppSelector } from '../hooks/redux';
import { useGetTasksQuery, useGetTimeLogsQuery } from '../services/api';
import { 
  HiOutlineClipboardList, 
  HiOutlineCheckCircle, 
  HiOutlineClock, 
  HiOutlineExclamationCircle,
  HiOutlineCalendar,
  HiOutlinePencilAlt,
  HiOutlineEye,
  HiOutlineChartBar
} from 'react-icons/hi';
import '../styles/EmployeeDashboard.css';
import type { UpcomingDeadline, EmployeeDashboardStats } from '../types/components/EmployeeDashboardTypes';
import MeetingsListPage from '../modules/meetings/pages/MeetingsListPage';
import MeetingNotes from '../modules/meetings/components/MeetingNotes';

const EmployeeDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  // Meetings removed (dummy data)
  
  // Fetch tasks and time logs using RTK Query
  const { data: tasksResponse, isLoading: tasksLoading } = useGetTasksQuery({ page: 1, limit: 100 });
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: timeLogs = [], isLoading: timeLogsLoading } = useGetTimeLogsQuery({
    startDate: thirtyDaysAgo.toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const loading = tasksLoading || timeLogsLoading;
  const allTasks = tasksResponse?.tasks || [];

  // Calculate stats from fetched data
  const stats = useMemo<EmployeeDashboardStats>(() => {
    const totalTasks = allTasks.length;
    const tasksCompleted = allTasks.filter((t) => t.status === 'DONE').length;
    const tasksInProgress = allTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const tasksTodo = allTasks.filter((t) => t.status === 'TODO').length;
    const tasksInReview = allTasks.filter((t) => t.status === 'REVIEW').length;
    const completionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
    const hoursWorked = parseFloat(
      timeLogs.reduce((sum, log) => sum + Number(log.hours_worked), 0).toFixed(1)
    );

    return {
      totalTasks,
      tasksCompleted,
      tasksInProgress,
      tasksTodo,
      tasksInReview,
      tasksOverdue: 0,
      tasksDueToday: 0,
      hoursWorked,
      completionRate,
      upcomingDeadlines: [],
    };
  }, [allTasks, timeLogs]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" aria-label="Loading" />
        <p>Loading your dashboard...</p>
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
            <HiOutlineClipboardList className="card-icon" />
          </div>

          <div className="stat-card color-green">
            <div>
              <p className="card-label">Completed</p>
              <p className="card-value">{stats.tasksCompleted}</p>
            </div>
            <HiOutlineCheckCircle className="card-icon" />
          </div>

          <div className="stat-card color-purple">
            <div>
              <p className="card-label">In Progress</p>
              <p className="card-value">{stats.tasksInProgress}</p>
            </div>
            <HiOutlineClock className="card-icon" />
          </div>

          <div className="stat-card color-red">
            <div>
              <p className="card-label">Overdue</p>
              <p className="card-value">{stats.tasksOverdue}</p>
            </div>
            <HiOutlineExclamationCircle className="card-icon" />
          </div>

          <div className="stat-card color-orange">
            <div>
              <p className="card-label">Due Today</p>
              <p className="card-value">{stats.tasksDueToday}</p>
            </div>
            <HiOutlineCalendar className="card-icon" />
          </div>

          <div className="stat-card color-yellow">
            <div>
              <p className="card-label">To Do</p>
              <p className="card-value">{stats.tasksTodo}</p>
            </div>
            <HiOutlinePencilAlt className="card-icon" />
          </div>

          <div className="stat-card color-pink">
            <div>
              <p className="card-label">In Review</p>
              <p className="card-value">{stats.tasksInReview}</p>
            </div>
            <HiOutlineEye className="card-icon" />
          </div>

          <div className="stat-card color-indigo">
            <div>
              <p className="card-label">Hours Worked</p>
              <p className="card-value">{stats.hoursWorked}<span className="card-unit"> hrs</span></p>
            </div>
            <HiOutlineClock className="card-icon hours-icon" />
          </div>

          <div className="stat-card color-teal">
            <div>
              <p className="card-label">Completion Rate</p>
              <p className="card-value">{stats.completionRate}<span className="card-unit">%</span></p>
            </div>
            <HiOutlineChartBar className="card-icon" />
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
                          <HiOutlineCalendar className="meta-icon" /> {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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

        {/* Removed empty state for no tasks */}
        {/* Removed meetings section from dashboard, now accessible via navbar */}
      </main>
    </div>
  );
};

export default EmployeeDashboard;

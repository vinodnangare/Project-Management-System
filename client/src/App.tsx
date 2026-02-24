import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import TaskDetail from './components/TaskDetail';
import TaskForm from './components/TaskForm';
import Login from './components/Login';
import Register from './components/Register';
import TimeLogger from './components/TimeLogger';
import AdminStats from './components/AdminStats';
import Reports from './components/Reports';
import EmployeeDashboard from './components/EmployeeDashboard';
import LeadDashboard from './pages/LeadDashboard';
import LeadPipeline from './pages/LeadPipeline';
import LeadList from './pages/LeadList';
import LeadDetail from './pages/LeadDetail';
import ProfileModal from './components/ProfileModal';
import NotificationBell from './components/NotificationBell';

import MeetingsListPage from './modules/meetings/pages/MeetingsListPage';
import MeetingDetailPage from './modules/meetings/pages/MeetingDetailPage';
import MeetingCalendarPage from './modules/meetings/pages/MeetingCalendarPage';
import MeetingFormPage from './modules/meetings/pages/MeetingFormPage';

import { useAppDispatch, useAppSelector } from './hooks/redux';
import { openTaskForm, closeTaskForm, setSelectedTask } from './store/slices/uiSlice';
import { logout } from './store/slices/authSlice';
import { openProfileModal } from './store/slices/uiModalSlice';

import './App.css';

function App() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const selectedTaskId = useAppSelector((state) => state.ui.selectedTaskId);
  const showTaskForm = useAppSelector((state) => state.ui.showTaskForm);

  // =============================
  // 🌙 DARK MODE STATE
  // =============================
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') !== 'light'
  );

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [isDarkMode]);

  // =============================
  // Role Based Redirect
  // =============================
  useEffect(() => {
    if (isAuthenticated && user && location.pathname === '/') {
      const defaultRoute =
        user.role === 'admin'
          ? '/admin/analytics'
          : user.role === 'manager'
          ? '/leads'
          : '/dashboard';

      navigate(defaultRoute, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const handleTaskCreated = () => {
    dispatch(closeTaskForm());
  };

  // =============================
  // PUBLIC ROUTES
  // =============================
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onSwitchToRegister={() => navigate('/register')} />} />
        <Route path="/register" element={<Register onSwitchToLogin={() => navigate('/login')} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // =============================
  // AUTHENTICATED LAYOUT
  // =============================
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Toaster position="top-right" />
        <ProfileModal />

        {/* Header */}
        <header className="app-header">
          <h1>📋 Task Management</h1>

          <div className="header-actions">
            <NotificationBell />

            <button
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="theme-toggle"
            >
              {isDarkMode ? '🌙 Dark' : '☀️ Light'}
            </button>

            <button onClick={() => dispatch(openProfileModal())}>
              Profile
            </button>

            <button onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="app-main">
          <Routes>

            {/* ================= ADMIN ================= */}
            {user?.role === 'admin' && (
              <>
                <Route path="/admin/analytics" element={<AdminStats />} />
                <Route path="/admin/reports" element={<Reports />} />
                <Route path="/leads" element={<LeadDashboard />} />
                <Route path="/leads/pipeline" element={<LeadPipeline />} />
                <Route path="/leads/list" element={<LeadList />} />
                <Route path="/leads/:id" element={<LeadDetail />} />
                <Route path="/meetings" element={<MeetingsListPage />} />
                <Route path="/meetings/:id" element={<MeetingDetailPage />} />
                <Route path="/meetings/calendar" element={<MeetingCalendarPage />} />
                <Route path="/meetings/new" element={<MeetingFormPage />} />
              </>
            )}

            {/* ================= MANAGER ================= */}
            {user?.role === 'manager' && (
              <>
                <Route path="/leads" element={<LeadDashboard />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/tasks" element={<TasksSection />} />
              </>
            )}

            {/* ================= EMPLOYEE ================= */}
            {user?.role === 'employee' && (
              <>
                <Route path="/dashboard" element={<EmployeeDashboard />} />
                <Route path="/time-log" element={<TimeLogger />} />
                <Route path="/tasks" element={<TasksSection />} />
                <Route path="/meetings" element={<MeetingsListPage />} />
              </>
            )}

            {/* Shared Tasks Route */}
            <Route path="/tasks" element={<TasksSection />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );

  // =============================
  // TASKS SECTION COMPONENT
  // =============================
  function TasksSection() {
    return (
      <div className="app-layout">
        <aside>
          <TaskList
            onTaskSelect={(taskId) => dispatch(setSelectedTask(taskId))}
            selectedTaskId={selectedTaskId || undefined}
          />
        </aside>

        <section>
          {showTaskForm ? (
            <TaskForm
              onTaskCreated={handleTaskCreated}
              onClose={() => dispatch(closeTaskForm())}
            />
          ) : selectedTaskId ? (
            <TaskDetail taskId={selectedTaskId} />
          ) : (
            <p>Select a task to view details</p>
          )}
        </section>
      </div>
    );
  }
}

export default App;
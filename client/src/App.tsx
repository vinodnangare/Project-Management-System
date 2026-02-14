import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import TaskList from './components/TaskList';
import TaskDetail from './components/TaskDetail';
import TaskForm from './components/TaskForm';
import Login from './components/Login';
import Register from './components/Register';
import TimeLogger from './components/TimeLogger';
import AdminStats from './components/AdminStats.tsx';
import Reports from './components/Reports.tsx';
import EmployeeDashboard from './components/EmployeeDashboard.tsx';
import LeadDashboard from './pages/LeadDashboard';
import LeadPipeline from './pages/LeadPipeline';
import LeadList from './pages/LeadList';
import LeadDetail from './pages/LeadDetail';
import ProfileModal from './components/ProfileModal';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { openTaskForm, closeTaskForm, setSelectedTask } from './store/slices/uiSlice';
import { logout, setCredentials } from './store/slices/authSlice';
import { openProfileModal } from './store/slices/uiModalSlice';
import './App.css';

function App() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, token } = useAppSelector((state) => state.auth);

  const selectedTaskId = useAppSelector((state) => state.ui.selectedTaskId);
  const showTaskForm = useAppSelector((state) => state.ui.showTaskForm);
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Clear old Express tokens on app initialization
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    // If there's a token but no valid user data, it's likely an old Express token
    // Clear it and let user re-login with Django
    if (storedToken && !storedUser) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch(logout());
    }
  }, [dispatch]);

  // Validate token once on app load to avoid stale/invalid tokens causing 403s
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return;

    const controller = new AbortController();
    fetch(`${apiBaseUrl}/auth/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
      signal: controller.signal,
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch(logout());
        }
      })
      .catch(() => {
        // Ignore network errors on startup
      });

    return () => controller.abort();
  }, [apiBaseUrl, dispatch]);

  useEffect(() => {
    // Only redirect if:
    // 1. User is authenticated AND
    // 2. User has a role AND
    // 3. They're on a public route
    if (isAuthenticated && user && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register')) {
      const defaultRoute = user.role === 'admin' ? '/admin/analytics' : user.role === 'manager' ? '/leads' : '/dashboard';
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

  const roleLabel = user?.role === 'admin' ? 'Admin' : user?.role === 'manager' ? 'Manager' : 'Employee';
  const roleEmoji = user?.role === 'admin' ? '🛠️' : user?.role === 'manager' ? '👔' : '💻';

  // Public routes (no authentication required)
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onSwitchToRegister={() => navigate('/register')} />} />
        <Route path="/register" element={<Register onSwitchToLogin={() => navigate('/login')} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Protected routes (authentication required)
  return (
    <Routes>
      <Route path="*" element={<AuthenticatedLayout 
        user={user}
        roleLabel={roleLabel}
        roleEmoji={roleEmoji}
        handleLogout={handleLogout}
        dispatch={dispatch}
        navigate={navigate}
        location={location}
        selectedTaskId={selectedTaskId}
        showTaskForm={showTaskForm}
        handleTaskCreated={handleTaskCreated}
      />} />
    </Routes>
  );
}

function AuthenticatedLayout({ 
  user, roleLabel, roleEmoji, handleLogout, dispatch, navigate, location,
  selectedTaskId, showTaskForm, handleTaskCreated 
}: any) {
  const currentPath = location.pathname;
  
  return (
    <div className="app-container">
      <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-left">
            <h1>📋 Task Management</h1>
            <p className="brand-subtitle">{user?.full_name || user?.email}</p>
          </div>
          <div className="header-role-chip">
            <span className="role-emoji">{roleEmoji}</span>
            <span className="role-text">{roleLabel}</span>
          </div>
        </div>

        <nav className="app-nav">
          <div className="nav-container">
            {/* Admin Navigation */}
            {user?.role === 'admin' && (
              <>
                <button
                  className={`nav-btn ${currentPath === '/tasks' ? 'active' : ''}`}
                  onClick={() => navigate('/tasks')}
                >
                  📋 Tasks
                </button>
                <button
                  className={`nav-btn ${currentPath === '/leads' ? 'active' : ''}`}
                  onClick={() => navigate('/leads')}
                >
                  🎯 Leads
                </button>
                <button
                  className={`nav-btn ${currentPath === '/admin/analytics' ? 'active' : ''}`}
                  onClick={() => navigate('/admin/analytics')}
                >
                  📊 Analytics
                </button>
                <button
                  className={`nav-btn ${currentPath === '/admin/reports' ? 'active' : ''}`}
                  onClick={() => navigate('/admin/reports')}
                >
                  📈 Reports
                </button>
              </>
            )}

            {/* Manager Navigation */}
            {user?.role === 'manager' && (
              <>
                <button
                  className={`nav-btn ${currentPath === '/leads' ? 'active' : ''}`}
                  onClick={() => navigate('/leads')}
                >
                  🎯 Leads
                </button>
                <button
                  className={`nav-btn ${currentPath === '/reports' ? 'active' : ''}`}
                  onClick={() => navigate('/reports')}
                >
                  📈 Reports
                </button>
              </>
            )}

            {/* Employee Navigation */}
            {user?.role === 'employee' && (
              <>
                <button
                  className={`nav-btn ${currentPath === '/dashboard' ? 'active' : ''}`}
                  onClick={() => navigate('/dashboard')}
                >
                  🎯 Dashboard
                </button>
                <button
                  className={`nav-btn ${currentPath === '/tasks' ? 'active' : ''}`}
                  onClick={() => navigate('/tasks')}
                >
                  📋 Tasks
                </button>
                <button
                  className={`nav-btn ${currentPath === '/time-log' ? 'active' : ''}`}
                  onClick={() => navigate('/time-log')}
                >
                  ⏱️ Time
                </button>
              </>
            )}
          </div>
        </nav>

        <div className="header-actions">
          <button
            className={`btn-create-task ${user?.role !== 'admin' || currentPath !== '/tasks' ? 'btn-hidden' : ''}`}
            onClick={() => dispatch(openTaskForm())}
            disabled={user?.role !== 'admin' || currentPath !== '/tasks'}
          >
            ✚ New Task
          </button>
          <button
            className="btn-profile"
            onClick={() => dispatch(openProfileModal())}
            aria-label="Profile"
            title="My Profile"
          >
            <span className="profile-avatar">
              {user?.profile_image_url ? (
                <img
                  src={user.profile_image_url}
                  alt="Profile"
                  className="profile-avatar-image"
                />
              ) : (
                user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()
              )}
            </span>
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            ⎇ Logout
          </button>
        </div>
      </header>

      <ProfileModal />

      <main className="app-main">
        <Routes>
          {/* Admin routes */}
          {user?.role === 'admin' && (
            <>
              <Route path="/admin/analytics" element={<AdminStats />} />
              <Route path="/leads" element={<LeadDashboard />} />
              <Route path="/leads/pipeline" element={<LeadPipeline />} />
              <Route path="/leads/list" element={<LeadList />} />
              <Route path="/leads/:id" element={<LeadDetail />} />
              <Route path="/admin/reports" element={<Reports />} /> 
              <Route path="/tasks" element={
                <div className="app-layout">
                  <aside className="task-list-panel">
                    <TaskList
                      onTaskSelect={(taskId) => dispatch(setSelectedTask(taskId))}
                      selectedTaskId={selectedTaskId || undefined}
                    />
                  </aside>
                  <section className="task-detail-panel">
                    {showTaskForm ? (
                      <TaskForm
                        onTaskCreated={handleTaskCreated}
                        onClose={() => dispatch(closeTaskForm())}
                      />
                    ) : selectedTaskId ? (
                      <TaskDetail taskId={selectedTaskId} />
                    ) : (
                      <div className="empty-state">
                        <p>Select a task to view details or create a new one</p>
                      </div>
                    )}
                  </section>
                </div>
              } />
              <Route path="/" element={<Navigate to="/admin/analytics" replace />} />
              <Route path="*" element={<Navigate to="/admin/analytics" replace />} />
            </>
          )}

          {/* Manager routes */}
          {user?.role === 'manager' && (
            <>
              <Route path="/leads" element={<LeadDashboard />} />
              <Route path="/leads/pipeline" element={<LeadPipeline />} />
              <Route path="/leads/list" element={<LeadList />} />
              <Route path="/leads/:id" element={<LeadDetail />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/tasks" element={
                <div className="app-layout">
                  <aside className="task-list-panel">
                    <TaskList
                      onTaskSelect={(taskId) => dispatch(setSelectedTask(taskId))}
                      selectedTaskId={selectedTaskId || undefined}
                    />
                  </aside>
                  <section className="task-detail-panel">
                    {selectedTaskId ? (
                      <TaskDetail taskId={selectedTaskId} />
                    ) : (
                      <div className="empty-state">
                        <p>Select a task to view details</p>
                      </div>
                    )}
                  </section>
                </div>
              } />
              <Route path="/" element={<Navigate to="/leads" replace />} />
              <Route path="*" element={<Navigate to="/leads" replace />} />
            </>
          )}
          
          {/* Employee routes */}
          {user?.role === 'employee' && (
            <>
              <Route path="/dashboard" element={<EmployeeDashboard />} />
              <Route path="/time-log" element={<TimeLogger />} />
              <Route path="/tasks" element={
                <div className="app-layout">
                  <aside className="task-list-panel">
                    <TaskList
                      onTaskSelect={(taskId) => dispatch(setSelectedTask(taskId))}
                      selectedTaskId={selectedTaskId || undefined}
                    />
                  </aside>
                  <section className="task-detail-panel">
                    {selectedTaskId ? (
                      <TaskDetail taskId={selectedTaskId} />
                    ) : (
                      <div className="empty-state">
                        <p>Select a task to view details</p>
                      </div>
                    )}
                  </section>
                </div>
              } />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

export default App;

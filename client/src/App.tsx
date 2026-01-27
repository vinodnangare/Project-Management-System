import { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import TaskDetail from './components/TaskDetail';
import TaskForm from './components/TaskForm';
import Login from './components/Login';
import Register from './components/Register';
import TimeLogger from './components/TimeLogger';
import AdminStats from './components/AdminStats.tsx';
import EmployeeDashboard from './components/EmployeeDashboard.tsx';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { fetchTasks } from './store/thunks';
import { openTaskForm, closeTaskForm, setSelectedTask } from './store/slices/uiSlice';
import { login as loginThunk, register as registerThunk, logout } from './store/slices/authSlice';
import './App.css';

function App() {
  const dispatch = useAppDispatch();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeView, setActiveView] = useState<'tasks' | 'timeLog' | 'dashboard' | 'stats'>('dashboard');
  
  const selectedTaskId = useAppSelector((state) => state.ui.selectedTaskId);
  const showTaskForm = useAppSelector((state) => state.ui.showTaskForm);
  const { isAuthenticated, loading, error, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      // Set default view based on user role
      setActiveView(user?.role === 'admin' ? 'stats' : 'dashboard');
      dispatch(fetchTasks({ page: 1, limit: 10 }));
    }
  }, [dispatch, isAuthenticated, user?.role]);

  const handleLogin = (email: string, password: string) => {
    dispatch(loginThunk({ email, password }));
  };

  const handleRegister = (email: string, password: string, fullName: string) => {
    dispatch(registerThunk({ email, password, full_name: fullName }));
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleTaskCreated = () => {
    dispatch(closeTaskForm());
    dispatch(fetchTasks({ page: 1, limit: 10 }));
  };

  const roleLabel = user?.role === 'admin' ? 'Admin' : 'Developer';
  const roleEmoji = user?.role === 'admin' ? '🛠️' : '💻';

  // Show login/register if not authenticated
  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setAuthMode('register')}
        loading={loading}
        error={error}
      />
    ) : (
      <Register
        onRegister={handleRegister}
        onSwitchToLogin={() => setAuthMode('login')}
        loading={loading}
        error={error}
      />
    );
  }

  // Show task management app if authenticated
  return (
    <div className="app-container">
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
          <button
            className={`nav-btn ${activeView === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveView('tasks')}
          >
            📋 Tasks
          </button>
          {user?.role === 'admin' ? (
            <button
              className={`nav-btn ${activeView === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveView('stats')}
            >
              📊 Analytics
            </button>
          ) : (
            <>
              <button
                className={`nav-btn ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveView('dashboard')}
              >
                🎯 Dashboard
              </button>
              <button
                className={`nav-btn ${activeView === 'timeLog' ? 'active' : ''}`}
                onClick={() => setActiveView('timeLog')}
              >
                ⏱️ Time
              </button>
            </>
          )}
        </nav>

        <div className="header-actions">
          {user?.role === 'admin' && activeView === 'tasks' && (
            <button
              className="btn-create-task"
              onClick={() => dispatch(openTaskForm())}
            >
              ✚ New Task
            </button>
          )}
          <button className="btn-logout" onClick={handleLogout}>
            ⎇ Logout
          </button>
        </div>
      </header>

      <main className="app-main">
        {activeView === 'stats' ? (
          <AdminStats />
        ) : activeView === 'dashboard' ? (
          <EmployeeDashboard />
        ) : activeView === 'timeLog' ? (
          <TimeLogger />
        ) : (
          <div className="app-layout">
            {/* Left Panel: Task List */}
            <aside className="task-list-panel">
              <TaskList
                onTaskSelect={(taskId) => dispatch(setSelectedTask(taskId))}
                selectedTaskId={selectedTaskId || undefined}
              />
            </aside>

            {/* Right Panel: Task Detail or Form */}
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
        )}
      </main>
    </div>
  );
}

export default App;

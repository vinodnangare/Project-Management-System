import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import './Sidebar.css';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const currentPath = location.pathname;

  const menuItems = {
    admin: [
      { label: 'Analytics', icon: '📊', path: '/admin/analytics' },
      { label: 'Tasks', icon: '📋', path: '/tasks' },
      { label: 'Leads', icon: '🎯', path: '/leads' },
      { label: 'Meetings', icon: '📅', path: '/meetings' },
      { label: 'Reports', icon: '📈', path: '/admin/reports' },
    ],
    manager: [
      { label: 'Leads', icon: '🎯', path: '/leads' },
      { label: 'Reports', icon: '📈', path: '/reports' },
      { label: 'Tasks', icon: '📋', path: '/tasks' },
    ],
    employee: [
      { label: 'Dashboard', icon: '🏠', path: '/dashboard' },
      { label: 'Tasks', icon: '📋', path: '/tasks' },
      { label: 'Meetings', icon: '📅', path: '/meetings' },
      { label: 'Time Log', icon: '⏱️', path: '/time-log' },
    ],
  };

  const items = user ? menuItems[user.role as keyof typeof menuItems] : [];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      
      <div className="sidebar-top">
        <button 
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '➡️' : '⬅️'}
        </button>
      </div>

      <div className="sidebar-menu">
        {items?.map((item) => (
          <div
            key={item.path}
            className={`sidebar-item ${
              currentPath === item.path ? 'active' : ''
            }`}
            onClick={() => navigate(item.path)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-label">{item.label}</span>}
          </div>
        ))}
      </div>
    </aside>
  );
}
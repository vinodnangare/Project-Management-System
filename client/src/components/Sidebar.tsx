import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import { 
  HiOutlineChartBar, 
  HiOutlineClipboardList, 
  HiOutlineFlag,
  HiOutlineCalendar,
  HiOutlineDocumentReport,
  HiOutlineHome,
  HiOutlineClock,
  HiOutlineChevronLeft,
  HiOutlineChevronRight
} from 'react-icons/hi';
import './Sidebar.css';

type IconComponent = React.ComponentType<{ className?: string }>;

interface MenuItem {
  label: string;
  icon: IconComponent;
  path: string;
}

interface MenuItems {
  admin: MenuItem[];
  manager: MenuItem[];
  employee: MenuItem[];
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const currentPath = location.pathname;

  const menuItems: MenuItems = {
    admin: [
      { label: 'Analytics', icon: HiOutlineChartBar, path: '/admin/analytics' },
      { label: 'Tasks', icon: HiOutlineClipboardList, path: '/tasks' },
      { label: 'Leads', icon: HiOutlineFlag, path: '/leads' },
      { label: 'Meetings', icon: HiOutlineCalendar, path: '/meetings' },
      { label: 'Reports', icon: HiOutlineDocumentReport, path: '/admin/reports' },
    ],
    manager: [
      { label: 'Leads', icon: HiOutlineFlag, path: '/leads' },
      { label: 'Reports', icon: HiOutlineDocumentReport, path: '/reports' },
      { label: 'Tasks', icon: HiOutlineClipboardList, path: '/tasks' },
    ],
    employee: [
      { label: 'Dashboard', icon: HiOutlineHome, path: '/dashboard' },
      { label: 'Tasks', icon: HiOutlineClipboardList, path: '/tasks' },
      { label: 'Meetings', icon: HiOutlineCalendar, path: '/meetings' },
      { label: 'Time Log', icon: HiOutlineClock, path: '/time-log' },
    ],
  };

  const items = user ? menuItems[user.role as keyof typeof menuItems] : [];

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__header">
        {!collapsed && (
          <div className="sidebar__brand">
            <span className="sidebar__logo">PM</span>
            <span className="sidebar__brand-text">Project</span>
          </div>
        )}
        <button 
          className="sidebar__toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <HiOutlineChevronRight className="sidebar__toggle-icon" />
          ) : (
            <HiOutlineChevronLeft className="sidebar__toggle-icon" />
          )}
        </button>
      </div>

      <nav className="sidebar__nav">
        <ul className="sidebar__menu">
          {items?.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || 
              (item.path !== '/' && currentPath.startsWith(item.path));
            
            return (
              <li key={item.path}>
                <button
                  className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
                  onClick={() => navigate(item.path)}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="sidebar__icon" />
                  {!collapsed && <span className="sidebar__label">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar__footer">
        {!collapsed && (
          <p className="sidebar__version">v1.0.0</p>
        )}
      </div>
    </aside>
  );
}
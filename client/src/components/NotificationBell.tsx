import React, { useEffect, useState } from 'react';
import { useGetNotificationsQuery } from '../services/api';
import NotificationDropdown from './NotificationDropdown';
import { HiOutlineBell } from 'react-icons/hi';
import '../styles/NotificationBell.css';

const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);

  const { data, isLoading, refetch } = useGetNotificationsQuery(undefined, {
    pollingInterval: 10000,
    refetchOnMountOrArgChange: true,
  });

  const notifications = data?.data ?? [];
  const unreadCount =
    data?.unread_count ??
    notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-bell-container')) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell"
        onClick={() => {
          setOpen((prev) => !prev);
          refetch();
        }}
        title="Notifications"
        aria-label="Notifications"
      >
        <span className="notification-icon" aria-hidden="true">
          <HiOutlineBell />
        </span>

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          notifications={notifications}
          isLoading={isLoading}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;

import React, { useEffect, useState } from 'react';
import { getSocket } from '../utils/socket';
import { useGetNotificationsQuery } from '../services/api';
import NotificationDropdown from './NotificationDropdown';
import { HiOutlineBell } from 'react-icons/hi';
import '../styles/NotificationBell.css';

const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const socket = getSocket();
    setIsLoading(true);

    // Request notifications once connected
    if (socket.connected) {
      socket.emit('get_notifications');
    } else {
      socket.on('connect', () => {
        socket.emit('get_notifications');
      });
    }

    // Listen for notifications list response
    socket.on('notifications', (data: { data: any[]; unread_count: number }) => {
      setNotifications(data.data || []);
      setUnreadCount(data.unread_count ?? (data.data || []).filter((n) => !n.is_read).length);
      setIsLoading(false);
    });

    // Listen for new real-time notifications 
    socket.on('notification:new', (notification: any) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off('connect');
      socket.off('notifications');
      socket.off('notification:new');
    };
  }, []);

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
        onClick={() => setOpen((prev) => !prev)}
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

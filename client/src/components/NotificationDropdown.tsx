import React from 'react';
import { useMarkNotificationAsReadMutation, type Notification } from '../services/api';
import '../styles/NotificationDropdown.css';
import type { NotificationDropdownProps } from '../types/components/NotificationDropdownProps';

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  isLoading,
  onClose,
}) => {
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId).unwrap();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-dropdown">
      <div className="notification-header">
        <h3>Notifications</h3>
        <button className="notification-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="notification-list">
        {isLoading ? (
          <div className="notification-loading">
            <p>Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
            >
              <div className="notification-content">
                <p className="notification-message">{notification.message}</p>
                <span className="notification-time">{formatDate(notification.created_at)}</span>
              </div>
              {!notification.is_read && (
                <button
                  className="notification-mark-read"
                  onClick={() => handleMarkAsRead(notification.id)}
                  title="Mark as read"
                >
                  Mark
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
import type { Notification } from '../../services/api';

export interface NotificationDropdownProps {
  notifications: Notification[];
  isLoading: boolean;
  onClose: () => void;
}

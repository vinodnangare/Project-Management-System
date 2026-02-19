export interface CreateNotificationPayload {
  user_id: string;
  message: string;
}

export interface NotificationResponse {
  success: boolean;
  data?: any;
  error?: string;
  unread_count?: number;
  total?: number;
}

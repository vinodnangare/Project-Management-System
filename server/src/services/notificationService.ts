import NotificationModel from "../models/Notification.js";
import type { INotification } from "../models/Notification.js";
import type { CreateNotificationPayload } from "../types/notification.js";



export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(payload: any) {

  const notification = await NotificationModel.create({
    user_id: payload.user_id,
    message: payload.message
  });

  return {
    id: notification._id.toString(),
    user_id: notification.user_id.toString(),
    message: notification.message,
    is_read: notification.is_read,
    created_at: notification.created_at
  };
}


  /**
   * Get all notifications for user
   */
  static async getUserNotifications(user_id: string, limit = 50, offset = 0) {

  const [notifications, total, unread] = await Promise.all([

    NotificationModel.find({ user_id })
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),

    NotificationModel.countDocuments({ user_id }),

    NotificationModel.countDocuments({ user_id, is_read: false })
  ]);

  return {
    notifications: notifications.map(n => ({
      id: n._id.toString(),
      user_id: n.user_id.toString(),
      message: n.message,
      is_read: n.is_read,
      created_at: n.created_at
    })),
    total,
    unread_count: unread
  };
}


  /**
   * Mark notification as read
   */
  static async markAsRead(notification_id: string, user_id: string) {

  const result = await NotificationModel.updateOne(
    { _id: notification_id, user_id },
    { is_read: true }
  );

  return result.modifiedCount > 0;
}


}

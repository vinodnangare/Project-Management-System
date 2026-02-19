import mongoose from 'mongoose';
import { Notification, INotification } from '../models/index.js';
import type { NotificationModel } from '../models/Notification.js';
import type { CreateNotificationPayload } from '../types/notification.js';

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(payload: CreateNotificationPayload): Promise<NotificationModel | null> {
    const { user_id, message } = payload;

    try {
      const notification = await Notification.create({
        user_id: new mongoose.Types.ObjectId(user_id),
        message,
        is_read: false
      });

      return {
        id: notification._id.toString(),
        user_id,
        message,
        is_read: false,
        created_at: notification.created_at.toISOString()
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  /**
   * Get all notifications for user
   */
  static async getUserNotifications(
    user_id: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ notifications: NotificationModel[]; total: number; unread_count: number }> {
    try {
      const userObjectId = new mongoose.Types.ObjectId(user_id);

      const [total, unread_count, notifications] = await Promise.all([
        Notification.countDocuments({ user_id: userObjectId }),
        Notification.countDocuments({ user_id: userObjectId, is_read: false }),
        Notification.find({ user_id: userObjectId })
          .sort({ created_at: -1 })
          .skip(offset)
          .limit(limit)
      ]);

      return {
        notifications: notifications.map(n => ({
          id: n._id.toString(),
          user_id,
          message: n.message,
          is_read: n.is_read,
          created_at: n.created_at.toISOString()
        })),
        total,
        unread_count
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], total: 0, unread_count: 0 };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notification_id: string, user_id: string): Promise<boolean> {
    try {
      const result = await Notification.updateOne(
        {
          _id: new mongoose.Types.ObjectId(notification_id),
          user_id: new mongoose.Types.ObjectId(user_id)
        },
        { $set: { is_read: true } }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
}

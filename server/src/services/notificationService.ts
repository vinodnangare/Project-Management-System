import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import type { NotificationModel } from '../models/Notification.js';
import type { CreateNotificationPayload } from '../types/notification.js';

const toMySQLDateTime = (isoString: string): string => {
  return new Date(isoString).toISOString().slice(0, 19).replace('T', ' ');
};

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(payload: CreateNotificationPayload): Promise<NotificationModel | null> {
    const { user_id, message } = payload;
    const id = uuidv4();
    const now = toMySQLDateTime(new Date().toISOString());

    const query = `
      INSERT INTO notifications (id, user_id, message, is_read, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    try {
      const connection = await pool.getConnection();
      await connection.execute(query, [
        id,
        user_id,
        message,
        false,
        now,
      ]);
      connection.release();

      return {
        id,
        user_id,
        message,
        is_read: false,
        created_at: now,
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
    const countQuery = 'SELECT COUNT(*) as total, SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread FROM notifications WHERE user_id = ?';
    const query = `
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    try {
      const connection = await pool.getConnection();
      
      const [countResult]: any = await connection.execute(countQuery, [user_id]);
      const total = countResult[0]?.total || 0;
      const unread_count = countResult[0]?.unread || 0;

      const [notifications]: any = await connection.execute(query, [user_id, limit, offset]);
      
      connection.release();

      return {
        notifications: notifications || [],
        total,
        unread_count,
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
    const query = 'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?';

    try {
      const connection = await pool.getConnection();
      const result = await connection.execute(query, [notification_id, user_id]);
      connection.release();

      return (result as any)[0]?.affectedRows > 0;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

}

import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService.js';
import type { NotificationResponse } from '../types/notification.js';

export async function getNotifications(req: Request, res: Response<NotificationResponse>): Promise<void> {
  try {
    const user_id = (req as any).user?.id;
    if (!user_id) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const { notifications, total, unread_count } = await NotificationService.getUserNotifications(user_id, limit, offset);

    res.json({
      success: true,
      data: notifications,
      unread_count,
      total,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
}

export async function markAsRead(req: Request, res: Response<NotificationResponse>): Promise<void> {
  try {
    const user_id = (req as any).user?.id;
    if (!user_id) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const success = await NotificationService.markAsRead(id, user_id);

    if (!success) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    res.json({
      success: true,
      data: { id, is_read: true },
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
}

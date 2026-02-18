import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';

const router = Router();

/**
 * GET /api/notifications
 * Get all notifications for user
 */
router.get('/', notificationController.getNotifications);

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', notificationController.markAsRead);

export default router;

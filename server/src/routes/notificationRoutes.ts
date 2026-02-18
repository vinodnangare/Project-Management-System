import { Router } from 'express';
import { verifyJwt } from '../middleware/authMiddleware.js';
import * as notificationController from '../controllers/notificationController.js';

const router = Router();

/**
 * GET /api/notifications
 * Get all notifications for user
 */
router.get('/', verifyJwt, notificationController.getNotifications);

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', verifyJwt, notificationController.markAsRead);

export default router;

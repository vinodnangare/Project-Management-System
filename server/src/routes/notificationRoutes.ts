import { Router } from 'express';
import { apiRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';

const router = Router();



// Get all notifications for the authenticated user
router.get('/', getNotifications);

// Mark a notification as read
router.patch('/:id/read', markAsRead);

export default router; 
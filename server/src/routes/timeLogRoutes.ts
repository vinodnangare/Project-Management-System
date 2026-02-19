import { Router } from 'express';
import * as timeLogController from '../controllers/timeLogController.js';
import { apiRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.use(apiRateLimiter);

router.post('/', timeLogController.logTime);
router.get('/range', timeLogController.getUserTimeLogs);
router.get('/date', timeLogController.getTimeLogByUserAndDate);
router.get('/all', timeLogController.getTimeLogsByDate);
// Admin: Get time logs for any user by userId and date range
router.get('/user/:userId', timeLogController.getTimeLogsByUserId);

export default router;

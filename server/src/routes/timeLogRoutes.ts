import { Router } from 'express';
import * as timeLogController from '../controllers/timeLogController.js';

/**
 * Time Log Routes
 * 
 * REST API Endpoints:
 * - POST   /time-logs           - Log hours for a day
 * - GET    /time-logs/range     - Get user's time logs for date range
 * - GET    /time-logs/date      - Get time log for specific date
 * - GET    /time-logs/all       - Get all users' time logs for a date (admin only)
 */

const router = Router();

// Time logging endpoints
router.post('/', timeLogController.logTime);
router.get('/range', timeLogController.getUserTimeLogs);
router.get('/date', timeLogController.getTimeLogByUserAndDate);
router.get('/all', timeLogController.getTimeLogsByDate);

export default router;

import { Router } from 'express';
import * as timeLogController from '../controllers/timeLogController.js';

const router = Router();


router.post('/', timeLogController.logTime);
router.get('/range', timeLogController.getUserTimeLogs);
router.get('/date', timeLogController.getTimeLogByUserAndDate);
router.get('/all', timeLogController.getTimeLogsByDate);
// Admin: Get time logs for any user by userId and date range
router.get('/user/:userId', timeLogController.getTimeLogsByUserId);

export default router;

import { Router } from 'express';
import * as timeLogController from '../controllers/timeLogController.js';

const router = Router();

router.post('/', timeLogController.logTime);
router.get('/range', timeLogController.getUserTimeLogs);
router.get('/date', timeLogController.getTimeLogByUserAndDate);
router.get('/all', timeLogController.getTimeLogsByDate);

export default router;

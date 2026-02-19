import { Router } from 'express';
import * as subtaskController from '../controllers/subtaskController.js';
import { apiRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.use(apiRateLimiter);

router.get('/:taskId/subtasks', subtaskController.getSubtasks);
router.post('/:taskId/subtasks', subtaskController.createSubtask);
router.patch('/:taskId/subtasks/:subtaskId', subtaskController.updateSubtaskStatus);
router.delete('/:taskId/subtasks/:subtaskId', subtaskController.deleteSubtask);

export default router;

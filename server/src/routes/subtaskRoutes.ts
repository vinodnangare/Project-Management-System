import { Router } from 'express';
import * as subtaskController from '../controllers/subtaskController.js';

const router = Router();

router.post('/:taskId/subtasks', subtaskController.createSubtask);
router.get('/:taskId/subtasks', subtaskController.getSubtasks);
router.patch('/:taskId/subtasks/:subtaskId', subtaskController.updateSubtaskStatus);
router.delete('/:taskId/subtasks/:subtaskId', subtaskController.deleteSubtask);

export default router;

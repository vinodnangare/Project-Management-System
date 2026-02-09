import { Router } from 'express';
import * as taskController from '../controllers/taskController.js';

const router = Router();

router.get('/assignees', taskController.getAssignableUsers);
router.get('/stats', taskController.getTaskStats);
router.get('/reports/summary', taskController.getReportSummary);
router.get('/reports/employee-performance', taskController.getEmployeePerformanceReport);
router.get('/reports/task-completion', taskController.getTaskCompletionReport);
router.get('/reports/export', taskController.exportReport);
router.get('/my-assigned', taskController.getMyAssignedTasks);

router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.patch('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

router.get('/:id/assignees', taskController.getTaskAssignees);
router.post('/:id/assignees', taskController.addTaskAssignee);
router.delete('/:id/assignees/:userId', taskController.removeTaskAssignee);

router.get('/:id/comments', taskController.getTaskComments);
router.post('/:id/comments', taskController.addComment);

router.get('/:id/activities', taskController.getTaskActivities);

router.get('/:id/docs', taskController.getTaskDoc);
router.put('/:id/docs', taskController.upsertTaskDoc);

export default router;

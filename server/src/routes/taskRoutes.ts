import { Router } from 'express';
import * as taskController from '../controllers/taskController.js';

/**
 * Task Routes
 * 
 * REST API Endpoints:
 * - GET    /tasks           - List all tasks (with filtering & pagination)
 * - GET    /tasks/:id       - Get single task
 * - POST   /tasks           - Create new task
 * - PATCH  /tasks/:id       - Update task
 * - DELETE /tasks/:id       - Delete task
 * - GET    /tasks/:id/comments    - Get task comments
 * - POST   /tasks/:id/comments    - Add comment
 * - GET    /tasks/:id/activities  - Get task activity log
 * 
 * Why this structure:
 * - Follows REST principles
 * - Clear semantic meaning (GET for read, POST for create, etc.)
 * - Hierarchical resources (nested comments under tasks)
 * - Consistent URL patterns
 */

const router = Router();

router.get('/assignees', taskController.getAssignableUsers);
router.get('/stats', taskController.getTaskStats);
router.get('/my-assigned', taskController.getMyAssignedTasks);

// Task management endpoints
router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.patch('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Group task assignees endpoints (multiple assignees per task)
router.get('/:id/assignees', taskController.getTaskAssignees);
router.post('/:id/assignees', taskController.addTaskAssignee);
router.delete('/:id/assignees/:userId', taskController.removeTaskAssignee);

// Comment endpoints
router.get('/:id/comments', taskController.getTaskComments);
router.post('/:id/comments', taskController.addComment);

// Activity log endpoints
router.get('/:id/activities', taskController.getTaskActivities);

export default router;

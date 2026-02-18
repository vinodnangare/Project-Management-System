import 'dotenv/config'; // Load environment variables FIRST, before importing anything else


console.log(process.env.DB_HOST)

import express, { Express } from 'express';
import cors from 'cors';
import { initializeDatabase } from './config/database.js';
import { requestLogger, errorHandler } from './middleware/errorHandler.js';
import { verifyJwt } from './middleware/authMiddleware.js';
import taskRoutes from './routes/taskRoutes.js';
import subtaskRoutes from './routes/subtaskRoutes.js';
import authRoutes from './routes/authRoutes.js';
import timeLogRoutes from './routes/timeLogRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app: Express = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

import * as authController from './controllers/authController.js';
import * as taskController from './controllers/taskController.js';
import * as subtaskController from './controllers/subtaskController.js';
import * as timeLogController from './controllers/timeLogController.js';

app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

app.use('/api/auth', authRoutes);

app.post('/api/auth/register', authController.register);

app.post('/api/auth/login', authController.signIn);

app.get('/api/auth/profile', verifyJwt, authController.getProfile);

app.patch('/api/auth/profile', verifyJwt, authController.updateProfile);

app.delete('/api/auth/employees/:employeeId', verifyJwt, authController.deleteEmployeeAccount);

app.get('/api/tasks', verifyJwt, taskController.getAllTasks);

app.get('/api/tasks/stats', verifyJwt, taskController.getTaskStats);

app.get('/api/tasks/reports/summary', verifyJwt, taskController.getReportSummary);

app.get('/api/tasks/reports/employee-performance', verifyJwt, taskController.getEmployeePerformanceReport);

app.get('/api/tasks/reports/task-completion', verifyJwt, taskController.getTaskCompletionReport);

app.get('/api/tasks/reports/export', verifyJwt, taskController.exportReport);

app.get('/api/tasks/assigned/me', verifyJwt, taskController.getMyAssignedTasks);

app.get('/api/tasks/users/assignable', verifyJwt, taskController.getAssignableUsers);

app.post('/api/tasks', verifyJwt, taskController.createTask);

app.get('/api/tasks/:id', verifyJwt, taskController.getTaskById);

app.patch('/api/tasks/:id', verifyJwt, taskController.updateTask);

app.delete('/api/tasks/:id', verifyJwt, taskController.deleteTask);

app.get('/api/tasks/:taskId/comments', verifyJwt, taskController.getTaskComments);

app.post('/api/tasks/:taskId/comments', verifyJwt, taskController.addComment);

app.get('/api/tasks/:taskId/activities', verifyJwt, taskController.getTaskActivities);

app.get('/api/tasks/:taskId/docs', verifyJwt, taskController.getTaskDoc);
app.put('/api/tasks/:taskId/docs', verifyJwt, taskController.upsertTaskDoc);

app.get('/api/tasks/:taskId/assignees', verifyJwt, taskController.getTaskAssignees);

app.post('/api/tasks/:taskId/assignees', verifyJwt, taskController.addTaskAssignee);

app.delete('/api/tasks/:taskId/assignees/:userId', verifyJwt, taskController.removeTaskAssignee);

app.post('/api/tasks/:taskId/subtasks', verifyJwt, subtaskController.createSubtask);

app.get('/api/tasks/:taskId/subtasks', verifyJwt, subtaskController.getSubtasks);

app.patch('/api/tasks/:taskId/subtasks/:subtaskId', verifyJwt, subtaskController.updateSubtaskStatus);

app.delete('/api/tasks/:taskId/subtasks/:subtaskId', verifyJwt, subtaskController.deleteSubtask);

app.post('/api/time-logs', verifyJwt, timeLogController.logTime);

app.get('/api/time-logs/range', verifyJwt, timeLogController.getUserTimeLogs);

app.get('/api/time-logs', verifyJwt, timeLogController.getUserTimeLogs);

app.use('/api/leads', verifyJwt, leadRoutes);

// Notification routes
app.use('/api/notifications', verifyJwt, notificationRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully');

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║  Task Management System Backend               ║
║  Server running on http://localhost:${PORT}        ║
║  API: http://localhost:${PORT}/api              ║
╚═══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

import 'dotenv/config'; // Load environment variables FIRST, before importing anything else


console.log('MongoDB URI:', process.env.MONGO_URI ? 'configured' : 'using default');

import express, { Express } from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database.js';
import { requestLogger, errorHandler } from './middleware/errorHandler.js';
import { verifyJwt } from './middleware/authMiddleware.js';
import { loginRateLimiter, registerRateLimiter } from './middleware/rateLimitMiddleware.js';
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

// Use route modules for tasks, leads, time-logs, and subtasks (rate limiter is applied in each router)
app.use('/api/auth', authRoutes);

app.post('/api/auth/register', registerRateLimiter, authController.register);

app.post('/api/auth/login', loginRateLimiter, authController.signIn);

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

app.delete('/api/tasks/:taskId/assignees/:userId', verifyJwt, taskController.removeTaskAssignee);

app.post('/api/tasks/:taskId/subtasks', verifyJwt, subtaskController.createSubtask);

app.get('/api/tasks/:taskId/subtasks', verifyJwt, subtaskController.getSubtasks);
// Use route modules for tasks, leads, time-logs, and subtasks (rate limiter is applied in each router)

app.patch('/api/tasks/:taskId/subtasks/:subtaskId', verifyJwt, subtaskController.updateSubtaskStatus);

app.delete('/api/tasks/:taskId/subtasks/:subtaskId', verifyJwt, subtaskController.deleteSubtask);

app.post('/api/time-logs', verifyJwt, timeLogController.logTime);

app.get('/api/time-logs/range', verifyJwt, timeLogController.getUserTimeLogs);

app.get('/api/time-logs', verifyJwt, timeLogController.getUserTimeLogs);
app.get('/api/time-logs/user/:userId', verifyJwt, timeLogController.getTimeLogsByUserId);

app.use('/api/leads', verifyJwt, leadRoutes);

// Notification routes
app.use('/api/notifications', verifyJwt, notificationRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDatabase();
    console.log('MongoDB connected successfully');

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║  Task Management System Backend               ║
║  Server running on http://localhost:${PORT}        ║
║  API: http://localhost:${PORT}/api              ║
║  Database: MongoDB                            ║
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

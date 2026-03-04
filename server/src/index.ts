import 'dotenv/config'; // Load environment variables FIRST, before importing anything else


console.log('MongoDB URI:', process.env.MONGO_URI ? 'configured' : 'using default');

import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDatabase } from './config/database.js';
import { requestLogger, errorHandler } from './middleware/errorHandler.js';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { verifyJwt } from './middleware/authMiddleware.js';
import { loginRateLimiter, registerRateLimiter } from './middleware/rateLimitMiddleware.js';
import taskRoutes from './routes/taskRoutes.js';
import subtaskRoutes from './routes/subtaskRoutes.js';
import authRoutes from './routes/authRoutes.js';
import timeLogRoutes from './routes/timeLogRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import { initMeetingScheduler } from './services/meetingSchedulerService.js';

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

// Assignable users endpoint - must be before :id routes
app.get('/api/tasks/users/assignable', verifyJwt, taskController.getAssignableUsers);

// Task CRUD operations
app.post('/api/tasks', verifyJwt, taskController.createTask);
app.get('/api/tasks/:id', verifyJwt, taskController.getTaskById);
app.patch('/api/tasks/:id', verifyJwt, taskController.updateTask);
app.delete('/api/tasks/:id', verifyJwt, taskController.deleteTask);

// Task assignees
app.get('/api/tasks/:taskId/assignees', verifyJwt, taskController.getTaskAssignees);
app.post('/api/tasks/:taskId/assignees', verifyJwt, taskController.addTaskAssignee);
app.delete('/api/tasks/:taskId/assignees/:userId', verifyJwt, taskController.removeTaskAssignee);

// Task comments
app.get('/api/tasks/:taskId/comments', verifyJwt, taskController.getTaskComments);
app.post('/api/tasks/:taskId/comments', verifyJwt, taskController.addComment);

// Task activities
app.get('/api/tasks/:taskId/activities', verifyJwt, taskController.getTaskActivities);

// Task docs
app.get('/api/tasks/:taskId/docs', verifyJwt, taskController.getTaskDoc);
app.put('/api/tasks/:taskId/docs', verifyJwt, taskController.upsertTaskDoc);

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

// Meeting routes
app.use('/api/meetings', verifyJwt, meetingRoutes);

// Determine the correct path to client build directory
const getClientDistPath = (): string => {
  // This runs from 'node server/dist/index.js' with cwd at project root
  // So we can use process.cwd() + 'client/dist' directly
  
  // Strategy 1: Direct from process.cwd (most reliable when run from root)
  const cwdResolution = path.resolve(process.cwd(), 'client', 'dist');
  
  // Strategy 2: Absolute from __dirname (for edge cases)
  const dirnameResolution = path.resolve(__dirname, '..', '..', 'client', 'dist');

  console.log('\n🔍 Searching for client dist directory...');
  console.log(`   cwd: ${process.cwd()}`);
  console.log(`   __dirname: ${__dirname}`);
  console.log(`   Strategy 1 (cwd resolution): ${cwdResolution}`);
  
  // Try each strategy
  const strategies = [
    { name: 'cwd resolution', path: cwdResolution },
    { name: 'dirname resolution', path: dirnameResolution },
  ];

  for (const strategy of strategies) {
    if (fs.existsSync(strategy.path)) {
      const indexPath = path.join(strategy.path, 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log(`✅ Found client dist using ${strategy.name}:`);
        console.log(`   Path: ${strategy.path}\n`);
        return strategy.path;
      }
    }
  }

  console.error('❌ Client dist not found!');
  console.error(`   Checked: ${cwdResolution}`);
  console.error(`   Also tried: ${dirnameResolution}`);
  console.error(`\n⚠️  Make sure you ran: npm run build\n`);
  
  // Return cwd strategy as fallback
  return cwdResolution;
};

const clientDistPath = getClientDistPath();

// Verify index.html exists
const indexPath = path.join(clientDistPath, 'index.html');
console.log(`🔎 Checking for index.html at: ${indexPath}`);
console.log(`   Exists: ${fs.existsSync(indexPath)}\n`);

// Serve React static files (frontend build)
app.use(express.static(clientDistPath, {
  maxAge: '1d',
  etag: false
}));

// Catch-all route: Serve index.html for any non-API routes
// This enables React Router to handle client-side routing
app.get('*', (req, res) => {
  // Don't serve index.html for API routes that don't exist
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
  
  // Serve index.html for all other routes (React SPA)
  const indexPath = path.join(clientDistPath, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found at:', indexPath);
    return res.status(404).json({ 
      success: false, 
      error: 'Frontend build not found. Make sure "npm run build" was executed in client directory.' 
    });
  }

  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(404).json({ success: false, error: 'Failed to load frontend' });
    }
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDatabase();
    console.log('MongoDB connected successfully');

    // Initialize recurring meeting scheduler (cron job)
    initMeetingScheduler();

    // Initialize Socket.IO server
    const httpServer = createServer(app);
    import('./services/socketService.js').then(m => m.initSocketServer(httpServer));
    httpServer.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║  Task Management System Backend               ║
║  Server running on http://localhost:${PORT}        ║
║  API: http://localhost:${PORT}/api              ║
║  Database: MongoDB                            ║
║  Recurring Meeting Scheduler: Active          ║
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

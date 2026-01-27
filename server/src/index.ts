import express, { Express } from 'express';
import cors from 'cors';
import { initializeDatabase } from './config/database.js';
import { requestLogger, errorHandler } from './middleware/errorHandler.js';
import { verifyJwt } from './middleware/authMiddleware.js';
import taskRoutes from './routes/taskRoutes.js';
import authRoutes from './routes/authRoutes.js';
import timeLogRoutes from './routes/timeLogRoutes.js';

/**
 * Express Application Setup
 * 
 * Architecture Overview:
 * 1. Middleware layer - CORS, logging, error handling
 * 2. Routes layer - API endpoints
 * 3. Controllers layer - Request handling and response formatting
 * 4. Services layer - Business logic and data access
 * 5. Database layer - Data persistence
 * 
 * This separation of concerns makes the code:
 * - Easy to understand and explain
 * - Testable at each layer
 * - Maintainable and scalable
 * - Professional and production-ready
 */

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', verifyJwt, taskRoutes);
app.use('/api/time-logs', verifyJwt, timeLogRoutes);

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
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

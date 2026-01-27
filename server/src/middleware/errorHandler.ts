import { Request, Response, NextFunction } from 'express';

/**
 * Request Logging Middleware
 * 
 * Why middleware:
 * - Logs all incoming requests with method, URL, and timestamp
 * - Helps debug issues and understand API usage patterns
 * - Standard practice in production applications
 * - Can be extended to log response times, status codes, etc.
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
};

/**
 * Error Handling Middleware
 * 
 * Why this matters:
 * - Catches unhandled errors and provides consistent error responses
 * - Prevents server crashes from unhandled exceptions
 * - Returns proper HTTP status codes
 * - Provides meaningful error messages to clients
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Unhandled Error:', error);

  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  });
};

/**
 * CORS Configuration Middleware
 * Already configured in Express setup, but this shows
 * how you could create custom middleware for additional logic
 */
export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isTokenBlacklisted } from '../services/tokenService.js';

// Access TokenExpiredError from the default export
const { TokenExpiredError } = jwt;

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'admin' | 'manager' | 'employee';
      };
    }
  }
}

/**
 * Verify JWT access token and check if it's blacklisted
 * Extracts user info from the token payload
 * Returns 401 if token is missing, invalid, expired, or blacklisted
 */
export const verifyJwt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
      return;
    }

    const token = parts[1];
    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';

    let payload: any;
    
    try {
      payload = jwt.verify(token, secret) as {
        id: string;
        email: string;
        role: 'admin' | 'manager' | 'employee';
        type?: string;
      };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        res.status(401).json({ 
          success: false, 
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }
      throw error;
    }

    // Check if this is an access token (new token system)
    if (payload.type && payload.type !== 'access') {
      res.status(401).json({ success: false, error: 'Unauthorized: Invalid token type' });
      return;
    }

    // Check if token is blacklisted (for immediate invalidation when token changes)
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      res.status(401).json({ 
        success: false, 
        error: 'Unauthorized: Token has been invalidated',
        code: 'TOKEN_INVALIDATED'
      });
      return;
    }

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
  }
};

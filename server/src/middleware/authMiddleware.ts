import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'admin' | 'employee';
      };
    }
  }
}

export const verifyJwt = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
      return;
    }

    const token = parts[1];
    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';

    const payload = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: 'admin' | 'employee';
    };

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role
    };

    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
  }
};

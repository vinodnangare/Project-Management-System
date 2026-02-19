import { Request, Response, NextFunction } from 'express';

const LEAD_ROLES = ['admin', 'manager', 'employee'] as const;

export const requireLeadAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  if (!LEAD_ROLES.includes(req.user.role)) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }

  next();
};

export const requireLeadManagerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }

  next();
};

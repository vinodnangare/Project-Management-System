import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { login, registerEmployee } from '../services/authService.js';

export const register = async (req: Request, res: Response) => {
  try {
    const user = await registerEmployee(req.body);
    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '8h' }
    );
    res.status(201).json({ success: true, data: { user, token } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const signIn = async (req: Request, res: Response) => {
  try {
    const user = await login(req.body);
    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '8h' }
    );
    res.status(200).json({ success: true, data: { user, token } });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message });
  }
};

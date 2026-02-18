import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { login, registerEmployee, updateUserProfile, deleteEmployee, updateProfileImage, getUserById } from '../services/authService.js';

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

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await getUserById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await updateUserProfile(userId, req.body);
    
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteEmployeeAccount = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;
    const { employeeId } = req.params;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({ success: false, error: 'Only admins can delete employees' });
      return;
    }

    await deleteEmployee(Array.isArray(employeeId) ? employeeId[0] : employeeId, adminId);
    res.status(200).json({ success: true, message: 'Employee deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }


    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }


    const user = await updateProfileImage(userId, req.file);
    
    
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

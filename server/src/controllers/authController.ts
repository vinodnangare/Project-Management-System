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
    console.error('Get profile error:', error.message);
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
    console.error('Profile update error:', error.message);
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

    await deleteEmployee(employeeId, adminId);
    res.status(200).json({ success: true, message: 'Employee deleted successfully' });
  } catch (error: any) {
    console.error('Delete employee error:', error.message);
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

    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Request headers:', req.headers);

    if (!req.file) {
      console.error('No file in request. File:', req.file, 'Body:', req.body);
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    console.log('Upload profile image request:', { userId, file: req.file.originalname });

    const user = await updateProfileImage(userId, req.file);
    
    console.log('Profile image updated successfully:', user.profile_image_url);
    
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    console.error('Profile image upload error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

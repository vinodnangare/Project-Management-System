import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { executeQuery } from '../config/database.js';
import cloudinary from '../config/cloudinary.js';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'employee';
  is_active: boolean;
  created_at: string;
  mobile_number?: string | null;
  profile_image_url?: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export const registerEmployee = async (data: RegisterRequest): Promise<User> => {
  const userId = uuidv4();
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const [existingUsers]: any = await executeQuery(
    'SELECT id FROM users WHERE email = ?',
    [data.email]
  );

  if (existingUsers && existingUsers.length > 0) {
    throw new Error('User with this email already exists');
  }

  await executeQuery(
    `INSERT INTO users (id, email, password, full_name, role, is_active, mobile_number)
     VALUES (?, ?, ?, ?, 'employee', 1, NULL)`,
    [userId, data.email, hashedPassword, data.full_name]
  );

  return {
    id: userId,
    email: data.email,
    full_name: data.full_name,
    role: 'employee',
    is_active: true,
    created_at: new Date().toISOString(),
    mobile_number: null,
    profile_image_url: null
  };
};

export const login = async (data: LoginRequest): Promise<User> => {
  const [users]: any = await executeQuery(
    'SELECT * FROM users WHERE email = ? AND is_active = 1',
    [data.email]
  );

  if (!users || users.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = users[0];
  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    mobile_number: user.mobile_number || null,
    profile_image_url: user.profile_image_url || null
  };
};

export const deleteEmployee = async (
  employeeId: string,
  adminId: string
): Promise<void> => {
  if (!employeeId || !adminId) {
    throw new Error('Employee ID and Admin ID are required');
  }

  const [admins]: any = await executeQuery(
    'SELECT role FROM users WHERE id = ?',
    [adminId]
  );

  if (!admins || admins.length === 0 || admins[0].role !== 'admin') {
    throw new Error('Only admins can delete employees');
  }

  const [users]: any = await executeQuery(
    'SELECT id, role FROM users WHERE id = ?',
    [employeeId]
  );

  if (!users || users.length === 0) {
    throw new Error('Employee not found');
  }

  if (users[0].role === 'admin') {
    throw new Error('Cannot delete admin users');
  }

  await executeQuery(
    'UPDATE users SET is_active = 0 WHERE id = ?',
    [employeeId]
  );
};

export const updateUserProfile = async (
  userId: string,
  data: { full_name?: string; mobile_number?: string }
): Promise<User> => {
  // Validation
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (data.full_name !== undefined && !data.full_name.trim()) {
    throw new Error('Full name cannot be empty');
  }

  if (data.mobile_number && data.mobile_number.trim()) {
    const cleanNumber = data.mobile_number.replace(/[-\s]/g, '');
    if (!/^\d{10}$/.test(cleanNumber)) {
      throw new Error('Mobile number must be 10 digits');
    }
  }

  const updateFields: string[] = [];
  const updateValues: any[] = [];

  if (data.full_name !== undefined) {
    updateFields.push('full_name = ?');
    updateValues.push(data.full_name.trim());
  }

  if (data.mobile_number !== undefined) {
    updateFields.push('mobile_number = ?');
    updateValues.push(data.mobile_number ? data.mobile_number.trim() : null);
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  updateValues.push(userId);

  await executeQuery(
    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  const [users]: any = await executeQuery(
    'SELECT id, email, full_name, role, is_active, created_at, mobile_number, profile_image_url FROM users WHERE id = ?',
    [userId]
  );

  if (!users || users.length === 0) {
    throw new Error('User not found');
  }

  const user = users[0];
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    mobile_number: user.mobile_number || null,
    profile_image_url: user.profile_image_url || null
  };
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const [users]: any = await executeQuery(
    'SELECT id, email, full_name, role, is_active, created_at, mobile_number, profile_image_url FROM users WHERE id = ?',
    [userId]
  );

  return users && users.length > 0 ? users[0] : null;
};

export const updateProfileImage = async (
  userId: string,
  file: Express.Multer.File
): Promise<User> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Get current user to delete old image if exists
  const [users]: any = await executeQuery(
    'SELECT profile_image_url FROM users WHERE id = ?',
    [userId]
  );

  if (!users || users.length === 0) {
    throw new Error('User not found');
  }

  const oldImageUrl = users[0].profile_image_url;

  // Delete old image from Cloudinary if exists
  if (oldImageUrl) {
    try {
      const publicId = oldImageUrl.split('/').pop()?.split('.')[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`profile_images/${publicId}`);
      }
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  }

  // Upload new image to Cloudinary
  const uploadResult = await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'profile_images',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good' }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(file.buffer);
  });

  // Update database with new image URL
  await executeQuery(
    'UPDATE users SET profile_image_url = ? WHERE id = ?',
    [uploadResult.secure_url, userId]
  );

  // Return updated user
  const [updatedUsers]: any = await executeQuery(
    'SELECT id, email, full_name, role, is_active, created_at, mobile_number, profile_image_url FROM users WHERE id = ?',
    [userId]
  );

  const user = updatedUsers[0];
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    mobile_number: user.mobile_number || null,
    profile_image_url: user.profile_image_url || null
  };
};

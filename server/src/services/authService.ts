import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
// @ts-ignore - bcrypt types are optional
import { executeQuery } from '../config/database.js';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'employee';
  is_active: boolean;
  created_at: string;
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

/**
 * Register a new employee (only employees can register, admins are created manually)
 */
export const registerEmployee = async (data: RegisterRequest): Promise<User> => {
  const userId = uuidv4();
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Check if user already exists
  const [existingUsers]: any = await executeQuery(
    'SELECT id FROM users WHERE email = ?',
    [data.email]
  );

  if (existingUsers && existingUsers.length > 0) {
    throw new Error('User with this email already exists');
  }

  // Create new employee user
  await executeQuery(
    `INSERT INTO users (id, email, password, full_name, role, is_active)
     VALUES (?, ?, ?, ?, 'employee', 1)`,
    [userId, data.email, hashedPassword, data.full_name]
  );

  return {
    id: userId,
    email: data.email,
    full_name: data.full_name,
    role: 'employee',
    is_active: true,
    created_at: new Date().toISOString()
  };
};

/**
 * Login for both admin and employee
 */
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
    created_at: user.created_at
  };
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  const [users]: any = await executeQuery(
    'SELECT id, email, full_name, role, is_active, created_at FROM users WHERE id = ?',
    [userId]
  );

  return users && users.length > 0 ? users[0] : null;
};

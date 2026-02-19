import bcrypt from 'bcrypt';
import { User, IUser } from '../models/index.js';
import cloudinary from '../config/cloudinary.js';

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'employee';
  is_active: boolean;
  created_at: string;
  mobile_number?: string | null;
  profile_image_url?: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role?: 'manager' | 'employee';
}

export interface LoginRequest {
  email: string;
  password: string;
}

const formatUserResponse = (user: IUser): UserResponse => ({
  id: user._id.toString(),
  email: user.email,
  full_name: user.full_name,
  role: user.role,
  is_active: user.is_active,
  created_at: user.created_at.toISOString(),
  mobile_number: user.mobile_number || null,
  profile_image_url: user.profile_image_url || null
});

export const registerEmployee = async (data: RegisterRequest): Promise<UserResponse> => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  console.log('RegisterEmployee received data:', {
    email: data.email,
    full_name: data.full_name,
    role: data.role,
    roleType: typeof data.role
  });

  const role = String(data.role || 'employee').trim().toLowerCase() as 'manager' | 'employee';

  console.log('Processed role:', { original: data.role, processed: role });

  // Validate role value
  if (!['manager', 'employee'].includes(role)) {
    throw new Error(`Invalid role: "${role}". Must be either "manager" or "employee"`);
  }

  // Check if user exists
  const existingUser = await User.findOne({ email: data.email.toLowerCase() });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  console.log('Inserting user with role:', role);

  const newUser = await User.create({
    email: data.email.toLowerCase(),
    password: hashedPassword,
    full_name: data.full_name,
    role: role,
    is_active: true,
    mobile_number: null
  });

  return formatUserResponse(newUser);
};

export const login = async (data: LoginRequest): Promise<UserResponse> => {
  const user = await User.findOne({ 
    email: data.email.toLowerCase(),
    is_active: true 
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  return formatUserResponse(user);
};

export const deleteEmployee = async (
  employeeIdentifier: string,
  adminId: string
): Promise<void> => {
  if (!employeeIdentifier || !adminId) {
    throw new Error('Employee ID and Admin ID are required');
  }

  const admin = await User.findById(adminId);

  if (!admin || admin.role !== 'admin') {
    throw new Error('Only admins can delete employees');
  }

  const identifier = String(employeeIdentifier).trim();
  const user = await User.findOne({
    $or: [
      { _id: identifier },
      { email: identifier }
    ]
  });

  if (!user) {
    throw new Error('Employee not found');
  }

  if (user.role === 'admin') {
    throw new Error('Cannot delete admin users');
  }

  await User.findByIdAndUpdate(user._id, { is_active: false });
};

export const updateUserProfile = async (
  userId: string,
  data: { full_name?: string; mobile_number?: string }
): Promise<UserResponse> => {
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

  const updateFields: Record<string, any> = {};

  if (data.full_name !== undefined) {
    updateFields.full_name = data.full_name.trim();
  }

  if (data.mobile_number !== undefined) {
    updateFields.mobile_number = data.mobile_number ? data.mobile_number.trim() : null;
  }

  if (Object.keys(updateFields).length === 0) {
    throw new Error('No fields to update');
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true }
  );

  if (!updatedUser) {
    throw new Error('User not found');
  }

  return formatUserResponse(updatedUser);
};

export const getUserById = async (userId: string): Promise<UserResponse | null> => {
  const user = await User.findById(userId);
  return user ? formatUserResponse(user) : null;
};

export const updateProfileImage = async (
  userId: string,
  file: Express.Multer.File
): Promise<UserResponse> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Get current user to delete old image if exists
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const oldImageUrl = user.profile_image_url;

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
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { profile_image_url: uploadResult.secure_url } },
    { new: true }
  );

  if (!updatedUser) {
    throw new Error('User not found after update');
  }

  return formatUserResponse(updatedUser);
};

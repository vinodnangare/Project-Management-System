import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'manager' | 'employee';
  is_active: boolean;
  mobile_number?: string | null;
  profile_image_url?: string | null;
  created_at: Date;
  updated_at: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: true
    },
    full_name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'employee'],
      default: 'employee',
      index: true
    },
    is_active: {
      type: Boolean,
      default: true
    },
    mobile_number: {
      type: String,
      default: null
    },
    profile_image_url: {
      type: String,
      default: null
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
export default User;

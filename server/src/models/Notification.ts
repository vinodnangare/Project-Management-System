import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  message: string;
  is_read: boolean;
  created_at: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true
    },
    is_read: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
);

notificationSchema.index({ user_id: 1, is_read: 1 });
notificationSchema.index({ user_id: 1, created_at: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;

// Keep the old interface for backward compatibility
export interface NotificationModel {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

import mongoose, { Schema, Document, Types } from "mongoose";

export interface INotification extends Document {
  user_id: Types.ObjectId;
  message: string;
  is_read: boolean;
  created_at: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
    timestamps: {
      createdAt: "created_at",
      updatedAt: false
    }
  }
);

/* for fast inbox loading */
NotificationSchema.index({ user_id: 1, created_at: -1 });

export default mongoose.model<INotification>("Notification", NotificationSchema);

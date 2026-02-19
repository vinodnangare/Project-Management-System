import mongoose, { Document, Schema } from 'mongoose';

export interface ITimeLog extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  task_id?: mongoose.Types.ObjectId | null;
  hours_worked: number;
  date: string;
  description?: string | null;
  created_at: Date;
  updated_at: Date;
}

const timeLogSchema = new Schema<ITimeLog>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    task_id: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
      index: true
    },
    hours_worked: {
      type: Number,
      required: true,
      min: 0,
      max: 24
    },
    date: {
      type: String,
      required: true,
      index: true
    },
    description: {
      type: String,
      default: null
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Unique compound index for user_id + date
timeLogSchema.index({ user_id: 1, date: 1 }, { unique: true });

export const TimeLog = mongoose.model<ITimeLog>('TimeLog', timeLogSchema);
export default TimeLog;

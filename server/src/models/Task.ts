import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigned_to?: mongoose.Types.ObjectId | null;
  created_by: mongoose.Types.ObjectId;
  due_date?: Date | null;
  estimated_hours?: number | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    description: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
      default: 'TODO',
      index: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM'
    },
    assigned_to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    due_date: {
      type: Date,
      default: null
    },
    estimated_hours: {
      type: Number,
      default: null
    },
    is_deleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Compound indexes
taskSchema.index({ status: 1, is_deleted: 1 });
taskSchema.index({ created_by: 1, is_deleted: 1 });
taskSchema.index({ assigned_to: 1, is_deleted: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
export default Task;

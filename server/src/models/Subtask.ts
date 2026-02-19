import mongoose, { Document, Schema } from 'mongoose';

export interface ISubtask extends Document {
  _id: mongoose.Types.ObjectId;
  task_id: mongoose.Types.ObjectId;
  title: string;
  description?: string | null;
  status: 'TODO' | 'DONE';
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const subtaskSchema = new Schema<ISubtask>(
  {
    task_id: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true
    },
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
      enum: ['TODO', 'DONE'],
      default: 'TODO',
      index: true
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

subtaskSchema.index({ task_id: 1, created_at: 1 });

export const Subtask = mongoose.model<ISubtask>('Subtask', subtaskSchema);
export default Subtask;

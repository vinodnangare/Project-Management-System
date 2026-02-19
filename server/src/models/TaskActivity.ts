import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskActivity extends Document {
  _id: mongoose.Types.ObjectId;
  task_id: mongoose.Types.ObjectId;
  action: string;
  old_value?: string | null;
  new_value?: string | null;
  performed_by: mongoose.Types.ObjectId;
  created_at: Date;
}

const taskActivitySchema = new Schema<ITaskActivity>(
  {
    task_id: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    old_value: {
      type: String,
      default: null
    },
    new_value: {
      type: String,
      default: null
    },
    performed_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
);

taskActivitySchema.index({ task_id: 1, created_at: -1 });

export const TaskActivity = mongoose.model<ITaskActivity>('TaskActivity', taskActivitySchema);
export default TaskActivity;

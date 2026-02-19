import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskAssignee extends Document {
  _id: mongoose.Types.ObjectId;
  task_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  assigned_by: mongoose.Types.ObjectId;
  assigned_at: Date;
}

const taskAssigneeSchema = new Schema<ITaskAssignee>(
  {
    task_id: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    assigned_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assigned_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Unique compound index
taskAssigneeSchema.index({ task_id: 1, user_id: 1 }, { unique: true });

export const TaskAssignee = mongoose.model<ITaskAssignee>('TaskAssignee', taskAssigneeSchema);
export default TaskAssignee;

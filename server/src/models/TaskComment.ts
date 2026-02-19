import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskComment extends Document {
  _id: mongoose.Types.ObjectId;
  task_id: mongoose.Types.ObjectId;
  comment: string;
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
}

const taskCommentSchema = new Schema<ITaskComment>(
  {
    task_id: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true
    },
    comment: {
      type: String,
      required: true
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
);

taskCommentSchema.index({ task_id: 1, created_at: -1 });

export const TaskComment = mongoose.model<ITaskComment>('TaskComment', taskCommentSchema);
export default TaskComment;

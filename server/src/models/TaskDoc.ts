import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskDoc extends Document {
  _id: mongoose.Types.ObjectId;
  task_id: mongoose.Types.ObjectId;
  content?: string | null;
  created_by: mongoose.Types.ObjectId;
  updated_by?: mongoose.Types.ObjectId | null;
  created_at: Date;
  updated_at: Date;
}

const taskDocSchema = new Schema<ITaskDoc>(
  {
    task_id: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true
    },
    content: {
      type: String,
      default: null
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updated_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

taskDocSchema.index({ task_id: 1, updated_at: -1 });

export const TaskDoc = mongoose.model<ITaskDoc>('TaskDoc', taskDocSchema);
export default TaskDoc;

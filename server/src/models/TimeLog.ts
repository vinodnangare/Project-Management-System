import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITimeLog extends Document {
  user_id: Types.ObjectId;
  task_id?: Types.ObjectId | null;
  hours_worked: number;
  date: string; // YYYY-MM-DD
  description?: string | null;
  created_at: Date;
  updated_at: Date;
}

const TimeLogSchema = new Schema<ITimeLog>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    task_id: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null
    },

    hours_worked: {
      type: Number,
      required: true,
      min: 0,
      max: 24
    },

    date: {
      type: String,
      required: true
    },

    description: {
      type: String,
      default: null
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

/* IMPORTANT: replaces UNIQUE(user_id, date) */
TimeLogSchema.index({ user_id: 1, date: 1 }, { unique: true });

export default mongoose.model<ITimeLog>("TimeLog", TimeLogSchema);

import mongoose, { Schema, Document, Types } from "mongoose";

/* ---------------- ENUMS ---------------- */

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  REVIEW = "REVIEW",
  DONE = "DONE"
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH"
}

export enum ActivityAction {
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  DELETED = "DELETED",
  ASSIGNED = "ASSIGNED",
  UNASSIGNED = "UNASSIGNED",
  STATUS_CHANGED = "STATUS_CHANGED",
  PRIORITY_CHANGED = "PRIORITY_CHANGED",
  TITLE_CHANGED = "TITLE_CHANGED",
  DESCRIPTION_CHANGED = "DESCRIPTION_CHANGED",
  DUE_DATE_CHANGED = "DUE_DATE_CHANGED",
  COMMENTED = "COMMENTED"
}

/* ---------------- SUB DOCUMENTS ---------------- */

const CommentSchema = new Schema(
  {
    comment: { type: String, required: true },
    created_by: { type: Types.ObjectId, ref: "User", required: true },
    created_at: { type: Date, default: Date.now }
  },
  { _id: true }
);

const ActivitySchema = new Schema(
  {
    action: { type: String, enum: Object.values(ActivityAction), required: true },
    old_value: { type: String, default: null },
    new_value: { type: String, default: null },
    performed_by: { type: Types.ObjectId, ref: "User", required: true },
    created_at: { type: Date, default: Date.now }
  },
  { _id: true }
);

const SubtaskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    status: { type: String, enum: ["TODO", "DONE"], default: "TODO" },
    created_by: { type: Types.ObjectId, ref: "User", required: true },
    created_at: { type: Date, default: Date.now }
  },
  { _id: true }
);

const TaskDocSchema = new Schema(
  {
    content: { type: String, default: "" },
    created_by: { type: Types.ObjectId, ref: "User" },
    updated_by: { type: Types.ObjectId, ref: "User" },
    updated_at: { type: Date }
  },
  { _id: false }
);

/* ---------------- MAIN TASK ---------------- */

export interface ITask extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;

  created_by: Types.ObjectId;
  assignees: Types.ObjectId[];

  due_date?: Date;
  estimated_hours?: number;

  comments: Types.DocumentArray<any>;
  activities: Types.DocumentArray<any>;
  subtasks: Types.DocumentArray<any>;
  doc?: any;

  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },

    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
      index: true
    },

    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
      index: true
    },

    created_by: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    assignees: [
      {
        type: Types.ObjectId,
        ref: "User",
        index: true
      }
    ],

    due_date: { type: Date, default: null },
    estimated_hours: { type: Number, default: null },

    comments: [CommentSchema],
    activities: [ActivitySchema],
    subtasks: [SubtaskSchema],
    doc: TaskDocSchema,

    is_deleted: { type: Boolean, default: false, index: true }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

/* ---------------- INDEXES (for reports & filters) ---------------- */

TaskSchema.index({ created_by: 1, status: 1 });
TaskSchema.index({ assignees: 1, status: 1 });
TaskSchema.index({ created_at: -1 });
TaskSchema.index({ due_date: 1 });

export default mongoose.model<ITask>("Task", TaskSchema);

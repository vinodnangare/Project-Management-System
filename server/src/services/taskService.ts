import mongoose from "mongoose";
import TaskModel, { TaskStatus, TaskPriority, ActivityAction } from "../models/Task.js";
import UserModel from "../models/User.js";
import { NotificationService } from './notificationService.js';
import {
  CreateTaskRequest,
  UpdateTaskRequest
} from '../validators/task.js';


const withTimeBounds = (date?: string, isEnd?: boolean): string | null => {
  if (!date) return null;
  if (date.includes(' ')) return date;
  return `${date} ${isEnd ? '23:59:59' : '00:00:00'}`;
};

interface QueryOptions {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  assigned_to?: string;
}

export const getAssignableUsers = async () => {
  const users = await UserModel.find({
    role: "employee",
    is_active: true
  })
    .select("_id full_name email")
    .lean();

  return users.map(u => ({
    id: u._id.toString(),
    full_name: u.full_name,
    email: u.email
  }));
};


export const addAssignee = async (
  taskId: string,
  userId: string,
  assignedBy: string
): Promise<void> => {

  const task = await TaskModel.findById(taskId);
  if (!task || task.is_deleted) throw new Error("Task not found");

  if (task.assignees.includes(new mongoose.Types.ObjectId(userId))) {
    throw new Error("Duplicate entry");
  }

  task.assignees.push(new mongoose.Types.ObjectId(userId));

  task.activities.push({
    action: ActivityAction.ASSIGNED,
    new_value: userId,
    performed_by: assignedBy
  } as any);

  await task.save();
};


export const removeAssignee = async (
  taskId: string,
  userId: string,
  unassignedBy: string
): Promise<void> => {

  const task = await TaskModel.findById(taskId);
  if (!task) throw new Error("Task not found");

  task.assignees = task.assignees.filter(
    id => id.toString() !== userId
  );

  task.activities.push({
    action: ActivityAction.UNASSIGNED,
    old_value: userId,
    performed_by: unassignedBy
  } as any);

  await task.save();
};


export const getTaskAssignees = async (taskId: string) => {

  const task = await TaskModel.findById(taskId)
    .populate("assignees", "full_name email")
    .select("assignees")
    .lean();

  if (!task) return [];

  return task.assignees.map((u: any) => ({
    id: u._id.toString(),
    full_name: u.full_name,
    email: u.email
  }));
};


export const getUserAssignedTasks = async (userId: string) => {

  return await TaskModel.find({
    assignees: new mongoose.Types.ObjectId(userId),
    is_deleted: false
  })
    .populate("created_by", "full_name email")
    .sort({ created_at: -1 })
    .lean();
};


export const getAllTasks = async (
  options: any,
  userId: string,
  userRole: string
) => {

  const page = Number(options.page || 1);
  const limit = Number(options.limit || 10);
  const skip = (page - 1) * limit;

  const filter: any = { is_deleted: false };

  if (userRole !== "admin") {
    filter.assignees = new mongoose.Types.ObjectId(userId);
  }

  if (options.status) filter.status = options.status;
  if (options.priority) filter.priority = options.priority;
  if (options.assigned_to) filter.assignees = new mongoose.Types.ObjectId(options.assigned_to);

  const [tasks, total] = await Promise.all([
    TaskModel.find(filter)
      .populate("created_by", "full_name email")
      .populate("assignees", "full_name email")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    TaskModel.countDocuments(filter)
  ]);

  return {
    tasks,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};


export const getTaskById = async (taskId: string) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) return null;

  return await TaskModel.findOne({
    _id: taskId,
    is_deleted: false
  })
    .populate("created_by", "full_name email")
    .populate("assignees", "full_name email")
    .lean();
};


export const createTask = async (data: any) => {

  const task = await TaskModel.create({
    title: data.title,
    description: data.description ?? null,
    priority: data.priority || TaskPriority.MEDIUM,
    created_by: data.created_by,
    assignees: data.assigned_to ? [data.assigned_to] : [],
    due_date: data.due_date || null,
    estimated_hours: data.estimated_hours ?? null,

    activities: [
      {
        action: ActivityAction.CREATED,
        new_value: data.title,
        performed_by: data.created_by
      }
    ]
  });

  return task.toObject();
};


export const updateTask = async (
  taskId: string,
  data: any,
  performedBy: string
) => {

  const task = await TaskModel.findById(taskId);
  if (!task || task.is_deleted) throw new Error("Task not found");

  const track = (action: ActivityAction, oldVal: any, newVal: any) => {
    if (oldVal !== newVal) {
      task.activities.push({
        action,
        old_value: oldVal,
        new_value: newVal,
        performed_by: performedBy
      } as any);
    }
  };

  if (data.title !== undefined) {
    track(ActivityAction.TITLE_CHANGED, task.title, data.title);
    task.title = data.title;
  }

  if (data.description !== undefined) {
    track(ActivityAction.DESCRIPTION_CHANGED, task.description, data.description);
    task.description = data.description;
  }

  if (data.status !== undefined) {
    track(ActivityAction.STATUS_CHANGED, task.status, data.status);
    task.status = data.status;
  }

  if (data.priority !== undefined) {
    track(ActivityAction.PRIORITY_CHANGED, task.priority, data.priority);
    task.priority = data.priority;
  }

  if (data.due_date !== undefined) {
    track(ActivityAction.DUE_DATE_CHANGED, task.due_date?.toString(), data.due_date);
    task.due_date = data.due_date;
  }

  await task.save();
  return task.toObject();
};


export const deleteTask = async (
  taskId: string,
  performedBy: string
): Promise<boolean> => {

  const task = await TaskModel.findById(taskId);
  if (!task) throw new Error("Task not found");

  task.is_deleted = true;

  task.activities.push({
    action: ActivityAction.DELETED,
    old_value: "active",
    new_value: "deleted",
    performed_by: performedBy
  } as any);

  await task.save();
  return true;
};


export const addComment = async (
  taskId: string,
  comment: string,
  createdBy: string
) => {

  const task = await TaskModel.findById(taskId);
  if (!task || task.is_deleted) throw new Error("Task not found");

  const newComment = {
    comment,
    created_by: new mongoose.Types.ObjectId(createdBy),
    created_at: new Date()
  };

  task.comments.push(newComment as any);

  task.activities.push({
    action: ActivityAction.COMMENTED,
    new_value: comment.substring(0, 50),
    performed_by: createdBy
  } as any);

  await task.save();

  return newComment;
};


export const getTaskComments = async (taskId: string) => {

  const task = await TaskModel.findById(taskId)
    .populate("comments.created_by", "full_name email profile_image_url")
    .select("comments")
    .lean();

  if (!task) return [];

  return task.comments.sort(
    (a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};


export const logActivity = async (data: {
  task_id: string;
  action: ActivityAction;
  old_value?: string | null;
  new_value?: string | null;
  performed_by: string;
}) => {

  const task = await TaskModel.findById(data.task_id);
  if (!task) return;

  task.activities.push({
    action: data.action,
    old_value: data.old_value ?? null,
    new_value: data.new_value ?? null,
    performed_by: data.performed_by
  } as any);

  await task.save();
};


export const getTaskActivities = async (taskId: string) => {

  const task = await TaskModel.findById(taskId)
    .populate("activities.performed_by", "full_name email profile_image_url")
    .select("activities")
    .lean();

  if (!task) return [];

  return task.activities.sort(
    (a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};


export const getTaskStats = async () => {

  const overall = await TaskModel.aggregate([
    { $match: { is_deleted: false } },
    {
      $group: {
        _id: null,
        total_tasks: { $sum: 1 },
        todo_tasks: { $sum: { $cond: [{ $eq: ["$status", "TODO"] }, 1, 0] } },
        in_progress_tasks: { $sum: { $cond: [{ $eq: ["$status", "IN_PROGRESS"] }, 1, 0] } },
        review_tasks: { $sum: { $cond: [{ $eq: ["$status", "REVIEW"] }, 1, 0] } },
        done_tasks: { $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] } }
      }
    }
  ]);

  const employees = await UserModel.aggregate([
    { $match: { role: "employee", is_active: true } },
    {
      $lookup: {
        from: "tasks",
        localField: "_id",
        foreignField: "assignees",
        as: "tasks"
      }
    },
    {
      $project: {
        employee_id: "$_id",
        employee_name: "$full_name",
        employee_email: "$email",
        profile_image_url: "$profile_image_url",
        todo: {
          $size: { $filter: { input: "$tasks", cond: { $eq: ["$$this.status", "TODO"] } } }
        },
        in_progress: {
          $size: { $filter: { input: "$tasks", cond: { $eq: ["$$this.status", "IN_PROGRESS"] } } }
        },
        review: {
          $size: { $filter: { input: "$tasks", cond: { $eq: ["$$this.status", "REVIEW"] } } }
        },
        done: {
          $size: { $filter: { input: "$tasks", cond: { $eq: ["$$this.status", "DONE"] } } }
        },
        total: { $size: "$tasks" }
      }
    }
  ]);

  return {
    overall: overall[0] || {},
    employees
  };
};


export const getReportSummary = async (startDate?: string, endDate?: string) => {

  const match: any = { is_deleted: false };

  if (startDate && endDate) {
    match.created_at = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const summary = await TaskModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total_tasks: { $sum: 1 },
        completed_tasks: { $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] } },
        pending_tasks: { $sum: { $cond: [{ $ne: ["$status", "DONE"] }, 1, 0] } },
        high_priority_tasks: { $sum: { $cond: [{ $eq: ["$priority", "HIGH"] }, 1, 0] } },
        overdue_tasks: {
          $sum: {
            $cond: [
              { $and: [{ $lt: ["$due_date", new Date()] }, { $ne: ["$status", "DONE"] }] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  return {
    summary: summary[0] || {},
    period: { start: startDate, end: endDate }
  };
};


export const getEmployeePerformanceReport = async (
  startDate?: string,
  endDate?: string
) => {

  const match: any = {};

  if (startDate && endDate) {
    match.created_at = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  return await UserModel.aggregate([
    { $match: { role: "employee", is_active: true } },
    {
      $lookup: {
        from: "tasks",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$$userId", "$assignees"] },
              is_deleted: false,
              ...match
            }
          }
        ],
        as: "tasks"
      }
    },
    {
      $project: {
        employee_name: "$full_name",
        employee_email: "$email",
        total_assigned: { $size: "$tasks" },
        completed: {
          $size: { $filter: { input: "$tasks", cond: { $eq: ["$$this.status", "DONE"] } } }
        },
        pending: {
          $size: { $filter: { input: "$tasks", cond: { $ne: ["$$this.status", "DONE"] } } }
        }
      }
    }
  ]);
};



export const getTaskCompletionReport = async (
  startDate?: string,
  endDate?: string
) => {

  const match: any = { status: "DONE", is_deleted: false };

  if (startDate && endDate) {
    match.updated_at = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  return await TaskModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$updated_at" }
        },
        tasks_completed: { $sum: 1 },
        avg_hours_to_complete: {
          $avg: { $divide: [{ $subtract: ["$updated_at", "$created_at"] }, 3600000] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};



export const getTaskDoc = async (taskId: string) => {

  const task = await TaskModel.findById(taskId)
    .populate("doc.created_by", "full_name email")
    .populate("doc.updated_by", "full_name email")
    .select("doc")
    .lean();

  if (!task || !task.doc) return null;

  return {
    id: null,
    task_id: taskId,
    content: task.doc.content || "",
    created_by: task.doc.created_by || null,
    updated_by: task.doc.updated_by || null,
    created_at: null,
    updated_at: task.doc.updated_at || null
  };
};


export const upsertTaskDoc = async (
  taskId: string,
  content: string,
  userId: string
) => {

  const task = await TaskModel.findById(taskId);
  if (!task) throw new Error("Task not found");

  const isNew = !task.doc || !task.doc.content;

  task.doc = {
    content,
    created_by: isNew ? userId : task.doc?.created_by,
    updated_by: userId,
    updated_at: new Date()
  };

  task.activities.push({
    action: "UPDATED",
    old_value: isNew ? null : "doc_updated",
    new_value: "doc_updated",
    performed_by: userId
  } as any);

  await task.save();

  return getTaskDoc(taskId);
};


export const exportReportData = async (
  reportType: string,
  startDate?: string,
  endDate?: string
): Promise<any> => {
  switch (reportType) {
    case 'summary':
      return await getReportSummary(startDate, endDate);
    case 'employee-performance':
      return await getEmployeePerformanceReport(startDate, endDate);
    case 'task-completion':
      return await getTaskCompletionReport(startDate, endDate);
    default:
      throw new Error('Invalid report type');
  }
};

export const convertToCSV = (data: any): string => {
  if (!data || typeof data !== 'object') return '';

  let csv = '';
  
  if (data.employees && Array.isArray(data.employees)) {
    const headers = Object.keys(data.employees[0] || {});
    csv = headers.join(',') + '\n';
    data.employees.forEach((row: any) => {
      csv += headers.map(h => row[h] ?? '').join(',') + '\n';
    });
  } else if (data.completion_trend && Array.isArray(data.completion_trend)) {
    const headers = Object.keys(data.completion_trend[0] || {});
    csv = headers.join(',') + '\n';
    data.completion_trend.forEach((row: any) => {
      csv += headers.map(h => row[h] ?? '').join(',') + '\n';
    });
  }

  return csv;
};

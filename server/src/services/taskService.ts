import mongoose from 'mongoose';
import { Task, TaskComment, TaskActivity, TaskAssignee, TaskDoc, User, ITask } from '../models/index.js';
import {
  Task as TaskType,
  TaskStatus,
  TaskPriority,
  TaskComment as TaskCommentType,
  TaskActivity as TaskActivityType,
  ActivityAction,
  PaginationMeta,
  TaskDoc as TaskDocType
} from '../types/index.js';
import {
  CreateTaskRequest,
  UpdateTaskRequest
} from '../validators/task.js';
import { NotificationService } from './notificationService.js';

interface QueryOptions {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  assigned_to?: string;
}

const formatTaskResponse = async (task: ITask): Promise<TaskType> => {
  const createdByUser = task.created_by ? await User.findById(task.created_by) : null;
  const assignedToUser = task.assigned_to ? await User.findById(task.assigned_to) : null;

  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description || null,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    assigned_to: task.assigned_to?.toString() || null,
    assigned_to_name: assignedToUser?.full_name || null,
    assigned_to_email: assignedToUser?.email || null,
    created_by: task.created_by.toString(),
    created_by_name: createdByUser?.full_name || null,
    created_by_email: createdByUser?.email || null,
    due_date: task.due_date?.toISOString() || null,
    estimated_hours: task.estimated_hours || null,
    is_deleted: task.is_deleted,
    created_at: task.created_at.toISOString(),
    updated_at: task.updated_at.toISOString()
  };
};

export const getAssignableUsers = async (): Promise<Array<{ id: string; full_name: string; email: string }>> => {
  const users = await User.find({
    role: 'employee',
    // role: { $in: ['employee', 'manager'] },
    is_active: true
  }).select('full_name email');

  return users.map(user => ({
    id: user._id.toString(),
    full_name: user.full_name,
    email: user.email
  }));
};

export const addAssignee = async (
  taskId: string,
  userId: string,
  assignedBy: string
): Promise<void> => {
  await TaskAssignee.create({
    task_id: new mongoose.Types.ObjectId(taskId),
    user_id: new mongoose.Types.ObjectId(userId),
    assigned_by: new mongoose.Types.ObjectId(assignedBy),
    assigned_at: new Date()
  });

  await logActivity({
    task_id: taskId,
    action: ActivityAction.ASSIGNED,
    old_value: null,
    new_value: userId,
    performed_by: assignedBy
  }).catch(console.error);

  try {
    const task = await Task.findById(taskId);
    const taskTitle = task?.title;
    const message = taskTitle
      ? `You have been assigned a task: ${taskTitle}`
      : 'You have been assigned a task.';

    await NotificationService.createNotification({
      user_id: userId,
      message
    });
  } catch (error) {
    console.error('Failed to create assignment notification:', error);
  }
};

export const removeAssignee = async (
  taskId: string,
  userId: string,
  unassignedBy: string
): Promise<void> => {
  await TaskAssignee.deleteOne({
    task_id: new mongoose.Types.ObjectId(taskId),
    user_id: new mongoose.Types.ObjectId(userId)
  });

  await logActivity({
    task_id: taskId,
    action: ActivityAction.UNASSIGNED,
    old_value: userId,
    new_value: null,
    performed_by: unassignedBy
  }).catch(console.error);
};

export const getTaskAssignees = async (
  taskId: string
): Promise<
  Array<{
    id: string;
    full_name: string;
    email: string;
    assigned_by: string;
    assigned_at: string;
  }>
> => {
  const assignees = await TaskAssignee.find({
    task_id: new mongoose.Types.ObjectId(taskId)
  })
    .populate('user_id', 'full_name email')
    .sort({ assigned_at: -1 });

  return assignees.map(a => ({
    id: (a.user_id as any)._id.toString(),
    full_name: (a.user_id as any).full_name,
    email: (a.user_id as any).email,
    assigned_by: a.assigned_by.toString(),
    assigned_at: a.assigned_at.toISOString()
  }));
};

export const getUserAssignedTasks = async (userId: string): Promise<TaskType[]> => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  // Get task IDs from task_assignees
  const assigneeTaskIds = await TaskAssignee.find({ 
    user_id: userObjectId 
  }).distinct('task_id');

  const tasks = await Task.find({
    $or: [
      { assigned_to: userObjectId },
      { _id: { $in: assigneeTaskIds } }
    ],
    is_deleted: false
  }).sort({ created_at: -1 });

  return Promise.all(tasks.map(formatTaskResponse));
};

export const getAllTasks = async (
  options: QueryOptions,
  userId: string,
  userRole: string
): Promise<{
  tasks: TaskType[];
  meta: PaginationMeta;
}> => {
  const page = Number(options.page || 1);
  const limit = Number(options.limit || 10);
  const skip = (page - 1) * limit;

  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  // Build query conditions
  const conditions: any = { is_deleted: false };

  if (userRole !== 'admin') {
    // Get task IDs from task_assignees for this user
    const assigneeTaskIds = await TaskAssignee.find({ 
      user_id: userObjectId 
    }).distinct('task_id');

    conditions.$or = [
      { assigned_to: userObjectId },
      { _id: { $in: assigneeTaskIds } }
    ];
  }

  if (options.status) {
    conditions.status = options.status;
  }

  if (options.priority) {
    conditions.priority = options.priority;
  }

  if (options.assigned_to) {
    const assignedToId = new mongoose.Types.ObjectId(options.assigned_to);
    const filterAssigneeTaskIds = await TaskAssignee.find({ 
      user_id: assignedToId 
    }).distinct('task_id');

    if (conditions.$or) {
      // If we already have $or conditions, we need to use $and
      conditions.$and = [
        { $or: conditions.$or },
        {
          $or: [
            { assigned_to: assignedToId },
            { _id: { $in: filterAssigneeTaskIds } }
          ]
        }
      ];
      delete conditions.$or;
    } else {
      conditions.$or = [
        { assigned_to: assignedToId },
        { _id: { $in: filterAssigneeTaskIds } }
      ];
    }
  }

  const total = await Task.countDocuments(conditions);

  const tasks = await Task.find(conditions)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);

  const formattedTasks = await Promise.all(tasks.map(formatTaskResponse));

  return {
    tasks: formattedTasks,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getTaskById = async (taskId: string): Promise<TaskType | null> => {
  try {
    const task = await Task.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
      is_deleted: false
    });

    if (!task) return null;

    return formatTaskResponse(task);
  } catch (error) {
    return null;
  }
};

export const createTask = async (data: CreateTaskRequest): Promise<TaskType> => {
  const task = await Task.create({
    title: data.title,
    description: data.description || null,
    status: TaskStatus.TODO,
    priority: data.priority || TaskPriority.MEDIUM,
    assigned_to: data.assigned_to ? new mongoose.Types.ObjectId(data.assigned_to) : null,
    created_by: new mongoose.Types.ObjectId(data.created_by),
    due_date: data.due_date ? new Date(data.due_date) : null,
    estimated_hours: data.estimated_hours || null,
    is_deleted: false
  });

  await logActivity({
    task_id: task._id.toString(),
    action: ActivityAction.CREATED,
    old_value: null,
    new_value: task.title,
    performed_by: data.created_by
  }).catch(console.error);

  return formatTaskResponse(task);
};

export const updateTask = async (
  taskId: string,
  data: UpdateTaskRequest,
  performedBy: string
): Promise<TaskType> => {
  const currentTask = await Task.findOne({
    _id: new mongoose.Types.ObjectId(taskId),
    is_deleted: false
  });

  if (!currentTask) {
    throw new Error('Task not found');
  }

  const updates: Record<string, any> = {};

  const trackChange = (
    field: string,
    oldValue: string | null,
    newValue: string | null,
    action: ActivityAction
  ) => {
    if (oldValue !== newValue) {
      logActivity({
        task_id: taskId,
        action,
        old_value: oldValue,
        new_value: newValue,
        performed_by: performedBy
      }).catch(console.error);
    }
  };

  if (data.title !== undefined) {
    updates.title = data.title;
    trackChange('title', currentTask.title, data.title as string, ActivityAction.TITLE_CHANGED);
  }

  if (data.description !== undefined) {
    updates.description = data.description || null;
    trackChange('description', currentTask.description || null, data.description || null, ActivityAction.DESCRIPTION_CHANGED);
  }

  if (data.status !== undefined) {
    updates.status = data.status;
    trackChange('status', currentTask.status, data.status as string, ActivityAction.STATUS_CHANGED);
  }

  if (data.priority !== undefined) {
    updates.priority = data.priority;
    trackChange('priority', currentTask.priority, data.priority as string, ActivityAction.PRIORITY_CHANGED);
  }

  if (data.assigned_to !== undefined) {
    updates.assigned_to = data.assigned_to ? new mongoose.Types.ObjectId(data.assigned_to) : null;
    const action = data.assigned_to === null ? ActivityAction.UNASSIGNED : ActivityAction.ASSIGNED;
    trackChange('assigned_to', currentTask.assigned_to?.toString() || null, data.assigned_to || null, action);
  }

  if (data.due_date !== undefined) {
    updates.due_date = data.due_date ? new Date(data.due_date) : null;
    trackChange(
      'due_date',
      currentTask.due_date?.toISOString() || null,
      data.due_date || null,
      ActivityAction.DUE_DATE_CHANGED
    );
  }

  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    { $set: updates },
    { new: true }
  );

  if (!updatedTask) {
    throw new Error('Task not found after update');
  }

  return formatTaskResponse(updatedTask);
};

export const deleteTask = async (
  taskId: string,
  performedBy: string
): Promise<boolean> => {
  const currentTask = await Task.findOne({
    _id: new mongoose.Types.ObjectId(taskId),
    is_deleted: false
  });

  if (!currentTask) {
    throw new Error('Task not found');
  }

  await Task.findByIdAndUpdate(taskId, { $set: { is_deleted: true } });

  await logActivity({
    task_id: taskId,
    action: ActivityAction.DELETED,
    old_value: 'active',
    new_value: 'deleted',
    performed_by: performedBy
  }).catch(console.error);

  return true;
};

export const addComment = async (
  taskId: string,
  comment: string,
  createdBy: string
): Promise<TaskCommentType> => {
  const task = await Task.findOne({
    _id: new mongoose.Types.ObjectId(taskId),
    is_deleted: false
  });

  if (!task) {
    throw new Error('Task not found');
  }

  const taskComment = await TaskComment.create({
    task_id: new mongoose.Types.ObjectId(taskId),
    comment,
    created_by: new mongoose.Types.ObjectId(createdBy)
  });

  await logActivity({
    task_id: taskId,
    action: ActivityAction.COMMENTED,
    old_value: null,
    new_value: comment.substring(0, 50),
    performed_by: createdBy
  }).catch(console.error);

  const user = await User.findById(createdBy);

  return {
    id: taskComment._id.toString(),
    task_id: taskId,
    comment: taskComment.comment,
    created_by: createdBy,
    created_by_name: user?.full_name || null,
    created_by_email: user?.email || null,
    created_at: taskComment.created_at.toISOString()
  };
};

export const getTaskComments = async (taskId: string): Promise<TaskCommentType[]> => {
  const comments = await TaskComment.find({
    task_id: new mongoose.Types.ObjectId(taskId)
  })
    .populate('created_by', 'full_name email')
    .sort({ created_at: -1 });

  return comments.map(c => ({
    id: c._id.toString(),
    task_id: taskId,
    comment: c.comment,
    created_by: c.created_by._id.toString(),
    created_by_name: (c.created_by as any).full_name || null,
    created_by_email: (c.created_by as any).email || null,
    created_at: c.created_at.toISOString()
  }));
};

export const logActivity = async (data: {
  task_id: string;
  action: ActivityAction;
  old_value: string | null;
  new_value: string | null;
  performed_by: string;
}): Promise<TaskActivityType> => {
  const activity = await TaskActivity.create({
    task_id: new mongoose.Types.ObjectId(data.task_id),
    action: data.action,
    old_value: data.old_value,
    new_value: data.new_value,
    performed_by: new mongoose.Types.ObjectId(data.performed_by)
  });

  return {
    id: activity._id.toString(),
    task_id: data.task_id,
    action: data.action,
    old_value: data.old_value,
    new_value: data.new_value,
    performed_by: data.performed_by,
    created_at: activity.created_at.toISOString()
  };
};

export const getTaskActivities = async (
  taskId: string
): Promise<TaskActivityType[]> => {
  const activities = await TaskActivity.find({
    task_id: new mongoose.Types.ObjectId(taskId)
  })
    .populate('performed_by', 'full_name email')
    .sort({ created_at: -1 });

  return activities.map(a => ({
    id: a._id.toString(),
    task_id: taskId,
    action: a.action as ActivityAction,
    old_value: a.old_value || null,
    new_value: a.new_value || null,
    performed_by: a.performed_by._id.toString(),
    performed_by_name: (a.performed_by as any).full_name || null,
    performed_by_email: (a.performed_by as any).email || null,
    created_at: a.created_at.toISOString()
  }));
};

export const getTaskStats = async (): Promise<{
  overall: {
    total_tasks: number;
    todo_tasks: number;
    in_progress_tasks: number;
    review_tasks: number;
    done_tasks: number;
    total_employees: number;
  };
  employees: Array<{
    employee_id: string;
    employee_name: string;
    employee_email: string;
    profile_image_url?: string | null;
    todo: number;
    in_progress: number;
    review: number;
    done: number;
    total: number;
  }>;
}> => {
  // Overall stats
  const overallStats = await Task.aggregate([
    { $match: { is_deleted: false } },
    {
      $group: {
        _id: null,
        total_tasks: { $sum: 1 },
        todo_tasks: { $sum: { $cond: [{ $eq: ['$status', 'TODO'] }, 1, 0] } },
        in_progress_tasks: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
        review_tasks: { $sum: { $cond: [{ $eq: ['$status', 'REVIEW'] }, 1, 0] } },
        done_tasks: { $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] } }
      }
    }
  ]);

  const totalEmployees = await User.countDocuments({
    role: 'employee',
    is_active: true
  });

  // Employee stats
  const employees = await User.find({
    role: 'employee',
    is_active: true
  }).select('full_name email profile_image_url');

  const employeeStats = await Promise.all(
    employees.map(async (emp) => {
      // Get tasks assigned directly or via task_assignees
      const assigneeTaskIds = await TaskAssignee.find({
        user_id: emp._id
      }).distinct('task_id');

      const taskStats = await Task.aggregate([
        {
          $match: {
            is_deleted: false,
            $or: [
              { assigned_to: emp._id },
              { _id: { $in: assigneeTaskIds } }
            ]
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            todo: { $sum: { $cond: [{ $eq: ['$status', 'TODO'] }, 1, 0] } },
            in_progress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
            review: { $sum: { $cond: [{ $eq: ['$status', 'REVIEW'] }, 1, 0] } },
            done: { $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] } }
          }
        }
      ]);

      const stats = taskStats[0] || { total: 0, todo: 0, in_progress: 0, review: 0, done: 0 };

      return {
        employee_id: emp._id.toString(),
        employee_name: emp.full_name,
        employee_email: emp.email,
        profile_image_url: emp.profile_image_url || null,
        todo: stats.todo,
        in_progress: stats.in_progress,
        review: stats.review,
        done: stats.done,
        total: stats.total
      };
    })
  );

  const overall = overallStats[0] || {
    total_tasks: 0,
    todo_tasks: 0,
    in_progress_tasks: 0,
    review_tasks: 0,
    done_tasks: 0
  };

  return {
    overall: {
      ...overall,
      total_employees: totalEmployees
    },
    employees: employeeStats.sort((a, b) => b.total - a.total)
  };
};

export const getReportSummary = async (
  startDate?: string,
  endDate?: string
): Promise<any> => {
  const dateFilter: any = {};
  if (startDate && endDate) {
    dateFilter.created_at = {
      $gte: new Date(startDate),
      $lte: new Date(endDate + 'T23:59:59.999Z')
    };
  }

  const summaryStats = await Task.aggregate([
    { $match: { is_deleted: false, ...dateFilter } },
    {
      $group: {
        _id: null,
        total_tasks: { $sum: 1 },
        completed_tasks: { $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] } },
        pending_tasks: { $sum: { $cond: [{ $in: ['$status', ['TODO', 'IN_PROGRESS', 'REVIEW']] }, 1, 0] } },
        high_priority_tasks: { $sum: { $cond: [{ $eq: ['$priority', 'HIGH'] }, 1, 0] } },
        overdue_tasks: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $lt: ['$due_date', new Date()] },
                  { $ne: ['$status', 'DONE'] },
                  { $ne: ['$due_date', null] }
                ]
              },
              1,
              0
            ]
          }
        },
        active_employees: { $addToSet: '$assigned_to' }
      }
    },
    {
      $project: {
        total_tasks: 1,
        completed_tasks: 1,
        pending_tasks: 1,
        high_priority_tasks: 1,
        overdue_tasks: 1,
        active_employees: { $size: '$active_employees' }
      }
    }
  ]);

  const tasksByStatus = await Task.aggregate([
    { $match: { is_deleted: false, ...dateFilter } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { status: '$_id', count: 1, _id: 0 } }
  ]);

  const tasksByPriority = await Task.aggregate([
    { $match: { is_deleted: false, ...dateFilter } },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] } }
      }
    },
    { $project: { priority: '$_id', count: 1, completed: 1, _id: 0 } }
  ]);

  return {
    summary: summaryStats[0] || {},
    by_status: tasksByStatus,
    by_priority: tasksByPriority,
    period: { start: startDate, end: endDate }
  };
};

export const getEmployeePerformanceReport = async (
  startDate?: string,
  endDate?: string
): Promise<any> => {
  const employees = await User.find({
    role: 'employee',
    is_active: true
  }).select('full_name email profile_image_url');

  const employeePerformance = await Promise.all(
    employees.map(async (emp) => {
      const assigneeTaskIds = await TaskAssignee.find({
        user_id: emp._id
      }).distinct('task_id');

      const stats = await Task.aggregate([
        {
          $match: {
            is_deleted: false,
            $or: [
              { assigned_to: emp._id },
              { _id: { $in: assigneeTaskIds } }
            ]
          }
        },
        {
          $group: {
            _id: null,
            total_assigned: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] } },
            in_progress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'TODO'] }, 1, 0] } },
            review: { $sum: { $cond: [{ $eq: ['$status', 'REVIEW'] }, 1, 0] } },
            overdue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $lt: ['$due_date', new Date()] },
                      { $ne: ['$status', 'DONE'] },
                      { $ne: ['$due_date', null] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      const s = stats[0] || { total_assigned: 0, completed: 0, in_progress: 0, pending: 0, review: 0, overdue: 0 };
      const completionRate = s.total_assigned > 0 ? ((s.completed / s.total_assigned) * 100).toFixed(2) : '0.00';

      return {
        employee_id: emp._id.toString(),
        employee_name: emp.full_name,
        employee_email: emp.email,
        profile_image_url: emp.profile_image_url || null,
        total_assigned: s.total_assigned,
        completed: s.completed,
        in_progress: s.in_progress,
        pending: s.pending,
        todo: s.pending,
        review: s.review,
        done: s.completed,
        overdue: s.overdue,
        completion_rate: parseFloat(completionRate)
      };
    })
  );

  const topPerformers = [...employeePerformance]
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 5)
    .map(p => ({
      id: p.employee_id,
      full_name: p.employee_name,
      completed_tasks: p.completed
    }));

  return {
    employees: employeePerformance.sort((a, b) => b.completion_rate - a.completion_rate),
    top_performers: topPerformers,
    period: { start: startDate, end: endDate }
  };
};

export const getTaskCompletionReport = async (
  startDate?: string,
  endDate?: string,
  groupBy: string = 'day'
): Promise<any> => {
  const dateFilter: any = {};
  if (startDate && endDate) {
    dateFilter.updated_at = {
      $gte: new Date(startDate),
      $lte: new Date(endDate + 'T23:59:59.999Z')
    };
  } else {
    dateFilter.updated_at = {
      $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    };
  }

  let dateFormat: string;
  switch (groupBy) {
    case 'week':
      dateFormat = '%Y-%U';
      break;
    case 'month':
      dateFormat = '%Y-%m';
      break;
    default:
      dateFormat = '%Y-%m-%d';
  }

  const completionTrend = await Task.aggregate([
    { $match: { is_deleted: false, status: 'DONE', ...dateFilter } },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$updated_at' } },
        tasks_completed: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $project: { period: '$_id', tasks_completed: 1, _id: 0 } }
  ]);

  const creationFilter: any = {};
  if (startDate && endDate) {
    creationFilter.created_at = {
      $gte: new Date(startDate),
      $lte: new Date(endDate + 'T23:59:59.999Z')
    };
  } else {
    creationFilter.created_at = {
      $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    };
  }

  const taskCreationTrend = await Task.aggregate([
    { $match: { is_deleted: false, ...creationFilter } },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$created_at' } },
        tasks_created: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $project: { period: '$_id', tasks_created: 1, _id: 0 } }
  ]);

  return {
    completion_trend: completionTrend,
    creation_trend: taskCreationTrend,
    group_by: groupBy,
    period: { start: startDate, end: endDate }
  };
};

export const getTaskDoc = async (taskId: string): Promise<TaskDocType | null> => {
  const doc = await TaskDoc.findOne({
    task_id: new mongoose.Types.ObjectId(taskId)
  }).sort({ updated_at: -1 });

  if (!doc) return null;

  return {
    id: doc._id.toString(),
    task_id: taskId,
    content: doc.content || null,
    created_by: doc.created_by.toString(),
    updated_by: doc.updated_by?.toString() || null,
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString()
  };
};

export const upsertTaskDoc = async (
  taskId: string,
  content: string,
  userId: string
): Promise<TaskDocType> => {
  const existing = await TaskDoc.findOne({
    task_id: new mongoose.Types.ObjectId(taskId)
  });

  if (!existing) {
    const doc = await TaskDoc.create({
      task_id: new mongoose.Types.ObjectId(taskId),
      content,
      created_by: new mongoose.Types.ObjectId(userId),
      updated_by: new mongoose.Types.ObjectId(userId)
    });

    return {
      id: doc._id.toString(),
      task_id: taskId,
      content: doc.content || null,
      created_by: userId,
      updated_by: userId,
      created_at: doc.created_at.toISOString(),
      updated_at: doc.updated_at.toISOString()
    };
  }

  const updated = await TaskDoc.findByIdAndUpdate(
    existing._id,
    {
      $set: {
        content,
        updated_by: new mongoose.Types.ObjectId(userId)
      }
    },
    { new: true }
  );

  if (!updated) {
    throw new Error('Failed to save task doc');
  }

  return {
    id: updated._id.toString(),
    task_id: taskId,
    content: updated.content || null,
    created_by: updated.created_by.toString(),
    updated_by: userId,
    created_at: updated.created_at.toISOString(),
    updated_at: updated.updated_at.toISOString()
  };
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

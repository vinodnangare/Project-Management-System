import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../config/database.js';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskComment,
  TaskActivity,
  ActivityAction,
  PaginationMeta,
  TaskDoc
} from '../types/index.js';
import {
  CreateTaskRequest,
  UpdateTaskRequest
} from '../validators/task.js';

const toMySQLDateTime = (isoString: string | null): string | null => {
  if (!isoString) return null;
  return new Date(isoString).toISOString().slice(0, 19).replace('T', ' ');
};

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

export const getAssignableUsers = async (): Promise<Array<{ id: string; full_name: string; email: string }>> => {
  const [rows]: any = await executeQuery(
    'SELECT id, full_name, email FROM users WHERE LOWER(role) = "employee" AND is_active = 1'
  );

  return (rows || []).map((row: any) => ({
    id: row.id,
    full_name: row.full_name,
    email: row.email
  }));
};

export const addAssignee = async (
  taskId: string,
  userId: string,
  assignedBy: string
): Promise<void> => {
  const assigneeId = uuidv4();
  const now = toMySQLDateTime(new Date().toISOString());

  await executeQuery(
    `INSERT INTO task_assignees (id, task_id, user_id, assigned_by, assigned_at)
     VALUES (?, ?, ?, ?, ?)`,
    [assigneeId, taskId, userId, assignedBy, now]
  );

  await logActivity({
    task_id: taskId,
    action: ActivityAction.ASSIGNED,
    old_value: null,
    new_value: userId,
    performed_by: assignedBy
  }).catch(console.error);
};

export const removeAssignee = async (
  taskId: string,
  userId: string,
  unassignedBy: string
): Promise<void> => {
  await executeQuery(
    `DELETE FROM task_assignees WHERE task_id = ? AND user_id = ?`,
    [taskId, userId]
  );

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
  const [rows]: any = await executeQuery(
    `SELECT 
      u.id, u.full_name, u.email,
      ta.assigned_by, ta.assigned_at
     FROM task_assignees ta
     JOIN users u ON u.id = ta.user_id
     WHERE ta.task_id = ?
     ORDER BY ta.assigned_at DESC`,
    [taskId]
  );

  return rows || [];
};

export const getUserAssignedTasks = async (userId: string): Promise<Task[]> => {
  const [tasks]: any = await executeQuery(
    `SELECT DISTINCT
      t.*, 
      cu.full_name AS created_by_name,
      cu.email AS created_by_email
     FROM tasks t
     LEFT JOIN users cu ON cu.id = t.created_by
     WHERE (t.assigned_to = ? OR t.id IN (
       SELECT task_id FROM task_assignees WHERE user_id = ?
     ))
     AND t.is_deleted = 0
     ORDER BY t.created_at DESC`,
    [userId, userId]
  );

  return (tasks || []) as Task[];
};

export const getAllTasks = async (
  options: QueryOptions,
  userId: string,
  userRole: string
): Promise<{
  tasks: Task[];
  meta: PaginationMeta;
}> => {
  const page = Number(options.page || 1);
  const limit = Number(options.limit || 10);
  const offset = (page - 1) * limit;

  let whereClause = 't.is_deleted = 0';
  const params: (string | number)[] = [];

  if (userRole !== 'admin') {
    whereClause += ' AND (t.assigned_to = ? OR EXISTS (SELECT 1 FROM task_assignees ta WHERE ta.task_id = t.id AND ta.user_id = ?))';
    params.push(userId, userId);
  }

  if (options.status) {
    whereClause += ' AND t.status = ?';
    params.push(options.status);
  }

  if (options.priority) {
    whereClause += ' AND t.priority = ?';
    params.push(options.priority);
  }

  if (options.assigned_to) {
    whereClause += ' AND (t.assigned_to = ? OR EXISTS (SELECT 1 FROM task_assignees ta2 WHERE ta2.task_id = t.id AND ta2.user_id = ?))';
    params.push(options.assigned_to, options.assigned_to);
  }

  const [countResult]: any = await executeQuery(
    `SELECT COUNT(*) as total FROM tasks t WHERE ${whereClause}`,
    params
  );

  const total = countResult[0].total;

  const [tasks]: any = await executeQuery(
    `SELECT 
      t.*, 
      cu.full_name AS created_by_name,
      cu.email AS created_by_email,
      au.full_name AS assigned_to_name,
      au.email AS assigned_to_email
     FROM tasks t
     LEFT JOIN users cu ON cu.id = t.created_by
     LEFT JOIN users au ON au.id = t.assigned_to
     WHERE ${whereClause}
     ORDER BY t.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return {
    tasks: (tasks || []) as Task[],
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getTaskById = async (taskId: string): Promise<Task | null> => {
  const [tasks]: any = await executeQuery(
    `SELECT 
      t.*, 
      cu.full_name AS created_by_name,
      cu.email AS created_by_email,
      au.full_name AS assigned_to_name,
      au.email AS assigned_to_email
     FROM tasks t
     LEFT JOIN users cu ON cu.id = t.created_by
     LEFT JOIN users au ON au.id = t.assigned_to
     WHERE t.id = ? AND t.is_deleted = 0`,
    [taskId]
  );

  return tasks?.[0] || null;
};

export const createTask = async (data: CreateTaskRequest): Promise<Task> => {
  const taskId = uuidv4();
  const now = toMySQLDateTime(new Date().toISOString());

  const task: Task = {
    id: taskId,
    title: data.title as string,
    description: data.description || null,
    status: TaskStatus.TODO,
    priority: (data.priority || TaskPriority.MEDIUM) as TaskPriority,
    assigned_to: data.assigned_to || null,
    created_by: data.created_by as string,
    due_date: toMySQLDateTime(data.due_date as string | null) || null,
    estimated_hours: data.estimated_hours || null,
    is_deleted: false,
    created_at: now!,
    updated_at: now!
  };

  await executeQuery(
    `INSERT INTO tasks (
      id, title, description, status, priority,
      assigned_to, created_by, due_date, estimated_hours, is_deleted,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.id,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.assigned_to,
      task.created_by,
      task.due_date,
      task.estimated_hours,
      task.is_deleted ? 1 : 0,
      task.created_at,
      task.updated_at
    ]
  );

  await logActivity({
    task_id: taskId,
    action: ActivityAction.CREATED,
    old_value: null,
    new_value: task.title,
    performed_by: data.created_by
  }).catch(console.error);

  const created = await getTaskById(taskId);
  return (created || task) as Task;
};

export const updateTask = async (
  taskId: string,
  data: UpdateTaskRequest,
  performedBy: string
): Promise<Task> => {
  const currentTask = await getTaskById(taskId);
  if (!currentTask) {
    throw new Error('Task not found');
  }

  const now = toMySQLDateTime(new Date().toISOString());
  const updates: string[] = [];
  const values: (string | number | boolean)[] = [];

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
    updates.push('title = ?');
    values.push(data.title as any);
    trackChange(
      'title',
      currentTask.title,
      data.title as any,
      ActivityAction.TITLE_CHANGED
    );
  }

  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push((data.description || null) as any);
    trackChange(
      'description',
      currentTask.description,
      data.description,
      ActivityAction.DESCRIPTION_CHANGED
    );
  }

  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status as any);
    trackChange(
      'status',
      currentTask.status,
      data.status as any,
      ActivityAction.STATUS_CHANGED
    );
  }

  if (data.priority !== undefined) {
    updates.push('priority = ?');
    values.push(data.priority as any);
    trackChange(
      'priority',
      currentTask.priority,
      data.priority as any,
      ActivityAction.PRIORITY_CHANGED
    );
  }

  if (data.assigned_to !== undefined) {
    updates.push('assigned_to = ?');
    values.push((data.assigned_to || null) as any);
    const action =
      data.assigned_to === null
        ? ActivityAction.UNASSIGNED
        : ActivityAction.ASSIGNED;
    trackChange(
      'assigned_to',
      currentTask.assigned_to,
      (data.assigned_to as any),
      action
    );
  }

  if (data.due_date !== undefined) {
    updates.push('due_date = ?');
    const mysqlDate = toMySQLDateTime(data.due_date as string | null);
    values.push((mysqlDate || null) as any);
    trackChange(
      'due_date',
      currentTask.due_date,
      mysqlDate,
      ActivityAction.DUE_DATE_CHANGED
    );
  }

  updates.push('updated_at = ?');
  values.push(now!);
  values.push(taskId);

  await executeQuery(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const updatedTask = await getTaskById(taskId);
  return updatedTask!;
};

export const deleteTask = async (
  taskId: string,
  performedBy: string
): Promise<boolean> => {
  const currentTask = await getTaskById(taskId);
  if (!currentTask) {
    throw new Error('Task not found');
  }

  const now = toMySQLDateTime(new Date().toISOString());

  await executeQuery(
    'UPDATE tasks SET is_deleted = 1, updated_at = ? WHERE id = ?',
    [now, taskId]
  );

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
): Promise<TaskComment> => {
  const task = await getTaskById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  const commentId = uuidv4();
  const now = toMySQLDateTime(new Date().toISOString());

  const taskComment: TaskComment = {
    id: commentId,
    task_id: taskId,
    comment,
    created_by: createdBy,
    created_at: now!
  };

  await executeQuery(
    `INSERT INTO task_comments (id, task_id, comment, created_by, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      taskComment.id,
      taskComment.task_id,
      taskComment.comment,
      taskComment.created_by,
      taskComment.created_at
    ]
  );

  await logActivity({
    task_id: taskId,
    action: ActivityAction.COMMENTED,
    old_value: null,
    new_value: comment.substring(0, 50),
    performed_by: createdBy
  }).catch(console.error);

  const [comments]: any = await executeQuery(
    `SELECT 
      tc.*,
      u.full_name AS created_by_name,
      u.email AS created_by_email
     FROM task_comments tc
     LEFT JOIN users u ON u.id = tc.created_by
     WHERE tc.id = ?`,
    [commentId]
  );

  return comments?.[0] || taskComment;
};

export const getTaskComments = async (taskId: string): Promise<TaskComment[]> => {
  const [comments]: any = await executeQuery(
    `SELECT 
      tc.*,
      u.full_name AS created_by_name,
      u.email AS created_by_email
     FROM task_comments tc
     LEFT JOIN users u ON u.id = tc.created_by
     WHERE tc.task_id = ? 
     ORDER BY tc.created_at DESC`,
    [taskId]
  );

  return (comments || []) as TaskComment[];
};

export const logActivity = async (data: {
  task_id: string;
  action: ActivityAction;
  old_value: string | null;
  new_value: string | null;
  performed_by: string;
}): Promise<TaskActivity> => {
  const activityId = uuidv4();
  const now = toMySQLDateTime(new Date().toISOString());

  const activity: TaskActivity = {
    id: activityId,
    task_id: data.task_id,
    action: data.action,
    old_value: data.old_value,
    new_value: data.new_value,
    performed_by: data.performed_by,
    created_at: now!
  };

  await executeQuery(
    `INSERT INTO task_activities (
      id, task_id, action, old_value, new_value, performed_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      activity.id,
      activity.task_id,
      activity.action,
      activity.old_value,
      activity.new_value,
      activity.performed_by,
      activity.created_at
    ]
  );

  return activity;
};

export const getTaskActivities = async (
  taskId: string
): Promise<TaskActivity[]> => {
  const [activities]: any = await executeQuery(
    `SELECT 
      ta.*,
      u.full_name AS performed_by_name,
      u.email AS performed_by_email
     FROM task_activities ta
     LEFT JOIN users u ON u.id = ta.performed_by
     WHERE ta.task_id = ? 
     ORDER BY ta.created_at DESC`,
    [taskId]
  );

  return (activities || []) as TaskActivity[];
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
  const [overallResult]: any = await executeQuery(
    `SELECT 
      COUNT(*) as total_tasks,
      SUM(CASE WHEN status = 'TODO' THEN 1 ELSE 0 END) as todo_tasks,
      SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_tasks,
      SUM(CASE WHEN status = 'REVIEW' THEN 1 ELSE 0 END) as review_tasks,
      SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as done_tasks,
      COUNT(DISTINCT assigned_to) as total_employees
     FROM tasks
     WHERE is_deleted = 0`
  );

  const [employeeResults]: any = await executeQuery(
    `SELECT 
      u.id as employee_id,
      u.full_name as employee_name,
      u.email as employee_email,
      u.profile_image_url as profile_image_url,
      u.is_active as is_active,
      COUNT(DISTINCT t.id) as total,
      SUM(CASE WHEN t.status = 'TODO' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN t.status = 'REVIEW' THEN 1 ELSE 0 END) as review,
      SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END) as done
     FROM users u
     LEFT JOIN tasks t ON (u.id = t.assigned_to OR u.id IN (
       SELECT user_id FROM task_assignees WHERE task_id = t.id
     )) AND t.is_deleted = 0
    WHERE LOWER(u.role) = 'employee' AND u.is_active = 1
     GROUP BY u.id, u.full_name, u.email, u.profile_image_url, u.is_active
     ORDER BY total DESC, u.full_name ASC`
  );

  const activeEmployees = (employeeResults || []).filter((emp: any) =>
    emp.is_active === 1 || emp.is_active === true || emp.is_active === '1'
  );

  return {
    overall: {
      total_tasks: overallResult[0]?.total_tasks || 0,
      todo_tasks: overallResult[0]?.todo_tasks || 0,
      in_progress_tasks: overallResult[0]?.in_progress_tasks || 0,
      review_tasks: overallResult[0]?.review_tasks || 0,
      done_tasks: overallResult[0]?.done_tasks || 0,
      total_employees: overallResult[0]?.total_employees || 0
    },
    employees: activeEmployees
  };
};

export const getReportSummary = async (
  startDate?: string,
  endDate?: string
): Promise<any> => {
  const startBound = withTimeBounds(startDate, false);
  const endBound = withTimeBounds(endDate, true);
  const dateFilter = startBound && endBound
    ? `AND created_at BETWEEN '${startBound}' AND '${endBound}'`
    : '';

  const [summaryResult]: any = await executeQuery(
    `SELECT 
      COUNT(*) as total_tasks,
      SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as completed_tasks,
      SUM(CASE WHEN status IN ('TODO', 'IN_PROGRESS', 'REVIEW') THEN 1 ELSE 0 END) as pending_tasks,
      AVG(CASE WHEN status = 'DONE' AND created_at IS NOT NULL 
        THEN TIMESTAMPDIFF(HOUR, created_at, updated_at) END) as avg_completion_hours,
      COUNT(DISTINCT assigned_to) as active_employees,
      SUM(CASE WHEN priority = 'HIGH' THEN 1 ELSE 0 END) as high_priority_tasks,
      SUM(CASE WHEN due_date < NOW() AND status != 'DONE' THEN 1 ELSE 0 END) as overdue_tasks
     FROM tasks t
     WHERE is_deleted = 0 ${dateFilter}`
  );

  const [tasksByStatus]: any = await executeQuery(
    `SELECT 
      status,
      COUNT(*) as count
     FROM tasks
     WHERE is_deleted = 0 ${dateFilter}
     GROUP BY status`
  );

  const [tasksByPriority]: any = await executeQuery(
    `SELECT 
      priority,
      COUNT(*) as count,
      SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as completed
     FROM tasks
     WHERE is_deleted = 0 ${dateFilter}
     GROUP BY priority`
  );

  return {
    summary: summaryResult[0] || {},
    by_status: tasksByStatus || [],
    by_priority: tasksByPriority || [],
    period: { start: startDate, end: endDate }
  };
};

export const getEmployeePerformanceReport = async (
  startDate?: string,
  endDate?: string
): Promise<any> => {
  const dateFilter = '';

  const [employeePerformance]: any = await executeQuery(
    `SELECT 
      u.id as employee_id,
      u.full_name as employee_name,
      u.email as employee_email,
      u.profile_image_url as profile_image_url,
      COUNT(DISTINCT t.id) as total_assigned,
      COALESCE(SUM(CASE WHEN UPPER(t.status) IN ('DONE', 'COMPLETED') THEN 1 ELSE 0 END), 0) as completed,
      COALESCE(SUM(CASE WHEN UPPER(t.status) IN ('IN_PROGRESS', 'INPROGRESS') THEN 1 ELSE 0 END), 0) as in_progress,
      COALESCE(SUM(CASE WHEN UPPER(t.status) IN ('TODO', 'PENDING') THEN 1 ELSE 0 END), 0) as pending,
      COALESCE(SUM(CASE WHEN UPPER(t.status) IN ('TODO', 'PENDING') THEN 1 ELSE 0 END), 0) as todo,
      COALESCE(SUM(CASE WHEN UPPER(t.status) = 'REVIEW' THEN 1 ELSE 0 END), 0) as review,
      COALESCE(SUM(CASE WHEN UPPER(t.status) IN ('DONE', 'COMPLETED') THEN 1 ELSE 0 END), 0) as done,
      COALESCE(SUM(CASE WHEN t.due_date < NOW() AND UPPER(t.status) NOT IN ('DONE', 'COMPLETED') THEN 1 ELSE 0 END), 0) as overdue,
      ROUND(AVG(CASE WHEN UPPER(t.status) IN ('DONE', 'COMPLETED') 
        THEN TIMESTAMPDIFF(HOUR, t.created_at, t.updated_at) END), 2) as avg_completion_hours,
      ROUND((SUM(CASE WHEN UPPER(t.status) IN ('DONE', 'COMPLETED') THEN 1 ELSE 0 END) / NULLIF(COUNT(t.id), 0)) * 100, 2) as completion_rate
     FROM users u
     LEFT JOIN tasks t ON (u.id = t.assigned_to OR u.id IN (
       SELECT user_id FROM task_assignees WHERE task_id = t.id
     )) AND t.is_deleted = 0 ${dateFilter}
      WHERE LOWER(u.role) = 'employee' AND u.is_active = 1
     GROUP BY u.id, u.full_name, u.email, u.profile_image_url
     ORDER BY completion_rate DESC, completed DESC`
  );

  const [topPerformers]: any = await executeQuery(
    `SELECT 
      u.id,
      u.full_name,
      COUNT(CASE WHEN UPPER(t.status) IN ('DONE', 'COMPLETED') THEN 1 END) as completed_tasks
     FROM users u
     LEFT JOIN tasks t ON (u.id = t.assigned_to OR u.id IN (
       SELECT user_id FROM task_assignees WHERE task_id = t.id
     )) AND t.is_deleted = 0 ${dateFilter}
      WHERE LOWER(u.role) = 'employee' AND u.is_active = 1
     GROUP BY u.id, u.full_name
     ORDER BY completed_tasks DESC
     LIMIT 5`
  );

  return {
    employees: employeePerformance || [],
    top_performers: topPerformers || [],
    period: { start: startDate, end: endDate }
  };
};

export const getTaskCompletionReport = async (
  startDate?: string,
  endDate?: string,
  groupBy: string = 'day'
): Promise<any> => {
  const startBound = withTimeBounds(startDate, false);
  const endBound = withTimeBounds(endDate, true);
  const dateFilter = startBound && endBound
    ? `AND updated_at BETWEEN '${startBound}' AND '${endBound}'`
    : `AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;

  let dateFormat = '%Y-%m-%d';
  if (groupBy === 'week') dateFormat = '%Y-%u';
  if (groupBy === 'month') dateFormat = '%Y-%m';

  const [completionTrend]: any = await executeQuery(
    `SELECT 
      DATE_FORMAT(updated_at, '${dateFormat}') as period,
      COUNT(*) as tasks_completed,
      AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_hours_to_complete
     FROM tasks
     WHERE status = 'DONE' AND is_deleted = 0 ${dateFilter}
     GROUP BY period
     ORDER BY period ASC`
  );

  const [taskCreationTrend]: any = await executeQuery(
    `SELECT 
      DATE_FORMAT(created_at, '${dateFormat}') as period,
      COUNT(*) as tasks_created
     FROM tasks
     WHERE is_deleted = 0 ${dateFilter}
     GROUP BY period
     ORDER BY period ASC`
  );

  return {
    completion_trend: completionTrend || [],
    creation_trend: taskCreationTrend || [],
    group_by: groupBy,
    period: { start: startDate, end: endDate }
  };
};

export const getTaskDoc = async (taskId: string): Promise<TaskDoc | null> => {
  const [rows]: any = await executeQuery(
    `SELECT * FROM task_docs WHERE task_id = ? ORDER BY updated_at DESC LIMIT 1`,
    [taskId]
  );

  return rows?.[0] || null;
};

export const upsertTaskDoc = async (
  taskId: string,
  content: string,
  userId: string
): Promise<TaskDoc> => {
  const now = toMySQLDateTime(new Date().toISOString());
  const existing = await getTaskDoc(taskId);

  if (!existing) {
    const docId = uuidv4();
    await executeQuery(
      `INSERT INTO task_docs (id, task_id, content, created_by, updated_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [docId, taskId, content, userId, userId, now, now]
    );
  } else {
    await executeQuery(
      `UPDATE task_docs SET content = ?, updated_by = ?, updated_at = ? WHERE id = ?`,
      [content, userId, now, existing.id]
    );
  }

  const updated = await getTaskDoc(taskId);
  if (!updated) {
    throw new Error('Failed to save task doc');
  }
  return updated;
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

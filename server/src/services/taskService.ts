import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../config/database.js';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskComment,
  TaskActivity,
  ActivityAction,
  PaginationMeta
} from '../types/index.js';
import {
  CreateTaskRequest,
  UpdateTaskRequest
} from '../validators/task.js';

/**
 * Convert ISO date string to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
 */
const toMySQLDateTime = (isoString: string | null): string | null => {
  if (!isoString) return null;
  return new Date(isoString).toISOString().slice(0, 19).replace('T', ' ');
};

/**
 * Task Service
 * 
 * Why use a service layer:
 * - Separates business logic from route handlers (Single Responsibility)
 * - Reusable across different endpoints
 * - Easier to test
 * - Centralized data access patterns
 * - Makes it easy to explain "where is the logic" to seniors
 * 
 * All database operations and business logic go here.
 */

interface QueryOptions {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  assigned_to?: string;
}

export const getAssignableUsers = async (): Promise<Array<{ id: string; full_name: string; email: string }>> => {
  const [rows]: any = await executeQuery(
    'SELECT id, full_name, email FROM users WHERE role = "employee" AND is_active = 1'
  );

  return (rows || []).map((row: any) => ({
    id: row.id,
    full_name: row.full_name,
    email: row.email
  }));
};

/**
 * Add an assignee to a task (supports multiple assignees)
 * @param taskId Task identifier
 * @param userId User to assign
 * @param assignedBy User performing the assignment
 */
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

  // Log activity
  await logActivity({
    task_id: taskId,
    action: ActivityAction.ASSIGNED,
    old_value: null,
    new_value: userId,
    performed_by: assignedBy
  }).catch(console.error);
};

/**
 * Remove an assignee from a task
 * @param taskId Task identifier
 * @param userId User to unassign
 * @param unassignedBy User performing the unassignment
 */
export const removeAssignee = async (
  taskId: string,
  userId: string,
  unassignedBy: string
): Promise<void> => {
  await executeQuery(
    `DELETE FROM task_assignees WHERE task_id = ? AND user_id = ?`,
    [taskId, userId]
  );

  // Log activity
  await logActivity({
    task_id: taskId,
    action: ActivityAction.UNASSIGNED,
    old_value: userId,
    new_value: null,
    performed_by: unassignedBy
  }).catch(console.error);
};

/**
 * Get all assignees for a task
 * @param taskId Task identifier
 * @returns Array of assignee users with assignment details
 */
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

/**
 * Get all tasks assigned to a user (including group tasks)
 * @param userId User identifier
 * @returns Array of tasks assigned to this user
 */
export const getUserAssignedTasks = async (userId: string): Promise<Task[]> => {
  const [tasks]: any = await executeQuery(
    `SELECT DISTINCT
      t.*, 
      cu.full_name AS created_by_name,
      cu.email AS created_by_email
     FROM tasks t
     LEFT JOIN users cu ON cu.id = t.created_by
     WHERE t.id IN (
       SELECT task_id FROM task_assignees WHERE user_id = ?
     )
     AND t.is_deleted = 0
     ORDER BY t.created_at DESC`,
    [userId]
  );

  return (tasks || []) as Task[];
};

/**
 * Get all tasks with filtering and pagination
 * @param options Query parameters for filtering
 * @returns Tasks array and pagination metadata
 */
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

  // Build WHERE clause with proper parameter handling
  let whereClause = 't.is_deleted = 0';
  const params: (string | number)[] = [];

  // Employees: tasks directly assigned OR in task_assignees
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

  // Get total count for pagination
  const [countResult]: any = await executeQuery(
    `SELECT COUNT(*) as total FROM tasks t WHERE ${whereClause}`,
    params
  );

  const total = countResult[0].total;

  // Get paginated tasks - LIMIT and OFFSET must be part of query string, not parameters
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

/**
 * Get a single task by ID
 * @param taskId Task identifier
 * @returns Task object or null if not found
 */
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

/**
 * Create a new task (Admin/Manager only)
 * @param data Task creation data
 * @returns Created task object
 */
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

  // Log the task creation activity
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

/**
 * Update a task
 * @param taskId Task identifier
 * @param data Partial task data to update
 * @param performedBy User performing the update
 * @returns Updated task object
 */
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

  // Helper function to track changes
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

  // Build dynamic UPDATE query based on provided fields
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

  // Always update the updated_at timestamp
  updates.push('updated_at = ?');
  values.push(now!);
  values.push(taskId);

  await executeQuery(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  // Fetch and return updated task
  const updatedTask = await getTaskById(taskId);
  return updatedTask!;
};

/**
 * Soft delete a task (mark as deleted but keep in database)
 * @param taskId Task identifier
 * @param performedBy User performing the deletion
 * @returns Success status
 */
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

  // Log deletion activity
  await logActivity({
    task_id: taskId,
    action: ActivityAction.DELETED,
    old_value: 'active',
    new_value: 'deleted',
    performed_by: performedBy
  }).catch(console.error);

  return true;
};

/**
 * Add a comment to a task
 * @param taskId Task identifier
 * @param comment Comment text
 * @param createdBy User creating the comment
 * @returns Created comment object
 */
export const addComment = async (
  taskId: string,
  comment: string,
  createdBy: string
): Promise<TaskComment> => {
  // Verify task exists
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

  // Log comment activity
  await logActivity({
    task_id: taskId,
    action: ActivityAction.COMMENTED,
    old_value: null,
    new_value: comment.substring(0, 50),
    performed_by: createdBy
  }).catch(console.error);

  return taskComment;
};

/**
 * Get all comments for a task
 * @param taskId Task identifier
 * @returns Comments array sorted by newest first
 */
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

/**
 * Log an activity (change) for a task
 * @param data Activity data
 * @returns Created activity object
 */
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

/**
 * Get all activities for a task
 * @param taskId Task identifier
 * @returns Activities array sorted by newest first
 */
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

/**
 * Get task statistics for admin dashboard
 * Returns overall stats and employee-wise breakdown
 */
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
    todo: number;
    in_progress: number;
    review: number;
    done: number;
    total: number;
  }>;
}> => {
  // Get overall stats
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

  // Get employee-wise stats
  const [employeeResults]: any = await executeQuery(
    `SELECT 
      u.id as employee_id,
      u.full_name as employee_name,
      u.email as employee_email,
      COUNT(t.id) as total,
      SUM(CASE WHEN t.status = 'TODO' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN t.status = 'REVIEW' THEN 1 ELSE 0 END) as review,
      SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END) as done
     FROM users u
     LEFT JOIN tasks t ON u.id = t.assigned_to AND t.is_deleted = 0
     WHERE u.role = 'employee'
     GROUP BY u.id, u.full_name, u.email
     ORDER BY total DESC, u.full_name ASC`
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
    employees: employeeResults || []
  };
};

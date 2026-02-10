import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../config/database.js';
import { Subtask } from '../types/index.js';

const toMySQLDateTime = (isoString: string | null): string | null => {
  if (!isoString) return null;
  return new Date(isoString).toISOString().slice(0, 19).replace('T', ' ');
};

export const createSubtask = async (
  taskId: string,
  title: string,
  description: string | null,
  createdBy: string
): Promise<Subtask> => {
  const subtaskId = uuidv4();
  const now = toMySQLDateTime(new Date().toISOString());

  const subtask: Subtask = {
    id: subtaskId,
    task_id: taskId,
    title,
    description: description ?? null,
    status: 'TODO',
    created_by: createdBy,
    created_at: now!,
    updated_at: now!
  };

  await executeQuery(
    `INSERT INTO subtasks (id, task_id, title, description, status, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      subtask.id,
      subtask.task_id,
      subtask.title,
      subtask.description,
      subtask.status,
      subtask.created_by,
      subtask.created_at,
      subtask.updated_at
    ]
  );

  return subtask;
};

export const getSubtasksByTaskId = async (taskId: string): Promise<Subtask[]> => {
  const [subtasks]: any = await executeQuery(
    `SELECT 
      s.*,
      u.full_name AS created_by_name,
      u.email AS created_by_email
     FROM subtasks s
     LEFT JOIN users u ON u.id = s.created_by
     WHERE s.task_id = ?
     ORDER BY s.created_at ASC`,
    [taskId]
  );

  return (subtasks || []) as Subtask[];
};

export const getSubtaskById = async (subtaskId: string): Promise<Subtask | null> => {
  const [subtasks]: any = await executeQuery(
    `SELECT 
      s.*,
      u.full_name AS created_by_name,
      u.email AS created_by_email
     FROM subtasks s
     LEFT JOIN users u ON u.id = s.created_by
     WHERE s.id = ?`,
    [subtaskId]
  );

  return subtasks?.[0] || null;
};

export const updateSubtaskStatus = async (
  subtaskId: string,
  status: 'TODO' | 'DONE'
): Promise<Subtask | null> => {
  const now = toMySQLDateTime(new Date().toISOString());

  await executeQuery(
    `UPDATE subtasks SET status = ?, updated_at = ? WHERE id = ?`,
    [status, now, subtaskId]
  );

  return getSubtaskById(subtaskId);
};

export const deleteSubtask = async (subtaskId: string): Promise<boolean> => {
  const [result]: any = await executeQuery(
    `DELETE FROM subtasks WHERE id = ?`,
    [subtaskId]
  );

  return (result as any).affectedRows > 0;
};

export const getTaskSubtaskStats = async (taskId: string): Promise<{ total: number; completed: number }> => {
  const [stats]: any = await executeQuery(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as completed
     FROM subtasks
     WHERE task_id = ?`,
    [taskId]
  );

  const result = stats?.[0] || { total: 0, completed: 0 };
  return {
    total: Number(result.total) || 0,
    completed: Number(result.completed) || 0
  };
};

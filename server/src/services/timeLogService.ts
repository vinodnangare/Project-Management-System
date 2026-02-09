import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../config/database.js';

export interface TimeLog {
  id: string;
  user_id: string;
  task_id: string | null;
  hours_worked: number;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTimeLogRequest {
  hours_worked: number;
  date: string;
  task_id?: string;
  description?: string;
}

export const logTime = async (
  userId: string,
  data: CreateTimeLogRequest
): Promise<TimeLog> => {
  const timeLogId = uuidv4();
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const [existing]: any = await executeQuery(
    'SELECT id FROM time_logs WHERE user_id = ? AND date = ?',
    [userId, data.date]
  );

  if (existing && existing.length > 0) {
    await executeQuery(
      `UPDATE time_logs 
       SET hours_worked = ?, task_id = ?, description = ?, updated_at = ?
       WHERE user_id = ? AND date = ?`,
      [
        data.hours_worked,
        data.task_id || null,
        data.description || null,
        now,
        userId,
        data.date
      ]
    );

    return getTimeLogByUserAndDate(userId, data.date);
  }

  await executeQuery(
    `INSERT INTO time_logs (id, user_id, task_id, hours_worked, date, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      timeLogId,
      userId,
      data.task_id || null,
      data.hours_worked,
      data.date,
      data.description || null,
      now,
      now
    ]
  );

  return {
    id: timeLogId,
    user_id: userId,
    task_id: data.task_id || null,
    hours_worked: data.hours_worked,
    date: data.date,
    description: data.description || null,
    created_at: now,
    updated_at: now
  };
};

export const getUserTimeLogs = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<TimeLog[]> => {
  const [logs]: any = await executeQuery(
    `SELECT * FROM time_logs 
     WHERE user_id = ? AND date BETWEEN ? AND ?
     ORDER BY date DESC`,
    [userId, startDate, endDate]
  );

  return logs || [];
};

export const getTimeLogByUserAndDate = async (
  userId: string,
  date: string
): Promise<TimeLog> => {
  const [logs]: any = await executeQuery(
    'SELECT * FROM time_logs WHERE user_id = ? AND date = ?',
    [userId, date]
  );

  if (!logs || logs.length === 0) {
    throw new Error('Time log not found');
  }

  return logs[0];
};

export const getTimeLogsByDate = async (date: string): Promise<TimeLog[]> => {
  const [logs]: any = await executeQuery(
    `SELECT tl.*, u.full_name FROM time_logs tl
     JOIN users u ON tl.user_id = u.id
     WHERE tl.date = ?
     ORDER BY u.full_name ASC`,
    [date]
  );

  return logs || [];
};

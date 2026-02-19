import mongoose from 'mongoose';
import { TimeLog, Task, User } from '../models/index.js';

export interface TimeLogResponse {
  id: string;
  user_id: string;
  task_id: string | null;
  hours_worked: number;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  task_title?: string;
  full_name?: string;
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
): Promise<TimeLogResponse> => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Check for existing time log on same date
  const existing = await TimeLog.findOne({
    user_id: userObjectId,
    date: data.date
  });

  if (existing) {
    // Update existing time log
    const updated = await TimeLog.findByIdAndUpdate(
      existing._id,
      {
        $set: {
          hours_worked: data.hours_worked,
          task_id: data.task_id ? new mongoose.Types.ObjectId(data.task_id) : null,
          description: data.description || null
        }
      },
      { new: true }
    );

    if (!updated) {
      throw new Error('Time log not found after update');
    }

    return {
      id: updated._id.toString(),
      user_id: userId,
      task_id: updated.task_id?.toString() || null,
      hours_worked: updated.hours_worked,
      date: updated.date,
      description: updated.description || null,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString()
    };
  }

  // Create new time log
  const timeLog = await TimeLog.create({
    user_id: userObjectId,
    task_id: data.task_id ? new mongoose.Types.ObjectId(data.task_id) : null,
    hours_worked: data.hours_worked,
    date: data.date,
    description: data.description || null
  });

  return {
    id: timeLog._id.toString(),
    user_id: userId,
    task_id: timeLog.task_id?.toString() || null,
    hours_worked: timeLog.hours_worked,
    date: timeLog.date,
    description: timeLog.description || null,
    created_at: timeLog.created_at.toISOString(),
    updated_at: timeLog.updated_at.toISOString()
  };
};

export const getUserTimeLogs = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<TimeLogResponse[]> => {
  const logs = await TimeLog.find({
    user_id: new mongoose.Types.ObjectId(userId),
    date: { $gte: startDate, $lte: endDate }
  })
    .populate('task_id', 'title')
    .sort({ date: -1 });

  return logs.map(log => ({
    id: log._id.toString(),
    user_id: userId,
    task_id: log.task_id?._id?.toString() || null,
    hours_worked: log.hours_worked,
    date: log.date,
    description: log.description || null,
    created_at: log.created_at.toISOString(),
    updated_at: log.updated_at.toISOString(),
    task_title: (log.task_id as any)?.title || null
  }));
};

export const getTimeLogByUserAndDate = async (
  userId: string,
  date: string
): Promise<TimeLogResponse> => {
  const log = await TimeLog.findOne({
    user_id: new mongoose.Types.ObjectId(userId),
    date: date
  });

  if (!log) {
    throw new Error('Time log not found');
  }

  return {
    id: log._id.toString(),
    user_id: userId,
    task_id: log.task_id?.toString() || null,
    hours_worked: log.hours_worked,
    date: log.date,
    description: log.description || null,
    created_at: log.created_at.toISOString(),
    updated_at: log.updated_at.toISOString()
  };
};

export const getTimeLogsByDate = async (date: string): Promise<TimeLogResponse[]> => {
  const logs = await TimeLog.find({ date })
    .populate('user_id', 'full_name')
    .sort({ 'user_id.full_name': 1 });

  return logs.map(log => ({
    id: log._id.toString(),
    user_id: log.user_id._id.toString(),
    task_id: log.task_id?.toString() || null,
    hours_worked: log.hours_worked,
    date: log.date,
    description: log.description || null,
    created_at: log.created_at.toISOString(),
    updated_at: log.updated_at.toISOString(),
    full_name: (log.user_id as any).full_name || null
  }));
};

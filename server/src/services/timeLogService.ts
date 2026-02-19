import mongoose from "mongoose";
import TimeLogModel from "../models/TimeLog.js";

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

export const logTime = async (userId: string, data: any) => {

  const log = await TimeLogModel.findOneAndUpdate(
    { user_id: userId, date: data.date },
    {
      hours_worked: data.hours_worked,
      task_id: data.task_id || null,
      description: data.description || null
    },
    { new: true, upsert: true }
  );

  return map(log);
};


export const getUserTimeLogs = async (
  userId: string,
  startDate: string,
  endDate: string
) => {

  const logs = await TimeLogModel.find({
    user_id: userId,
    date: { $gte: startDate, $lte: endDate }
  })
    .populate("task_id", "title")
    .sort({ date: -1 })
    .lean();

  return logs.map(map);
};


export const getTimeLogByUserAndDate = async (
  userId: string,
  date: string
) => {

  const log = await TimeLogModel.findOne({ user_id: userId, date });
  if (!log) throw new Error("Time log not found");

  return map(log);
};


export const getTimeLogsByDate = async (date: string) => {

  const logs = await TimeLogModel.find({ date })
    .populate("user_id", "full_name")
    .sort({ "user_id.full_name": 1 })
    .lean();

  return logs.map(map);
};

const map = (log: any) => ({
  id: log._id.toString(),
  user_id: log.user_id?._id?.toString?.() || log.user_id.toString(),
  task_id: log.task_id?._id?.toString?.() || log.task_id || null,
  hours_worked: log.hours_worked,
  date: log.date,
  description: log.description ?? null,
  created_at: log.created_at,
  updated_at: log.updated_at
});

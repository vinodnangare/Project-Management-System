import mongoose from "mongoose";
import TaskModel from "../models/Task.js";

import { Subtask } from '../types/index.js';



export const createSubtask = async (
  taskId: string,
  title: string,
  description: string | null,
  createdBy: string
) => {

  const task = await TaskModel.findById(taskId);
  if (!task) throw new Error("Task not found");

  const subtask = {
    _id: new mongoose.Types.ObjectId(),
    title,
    description: description ?? null,
    status: "TODO",
    created_by: createdBy,
    created_at: new Date()
  };

  task.subtasks.push(subtask as any);
  await task.save();

  return map(taskId, subtask);
};


export const getSubtasksByTaskId = async (taskId: string) => {

  const task = await TaskModel.findById(taskId)
    .populate("subtasks.created_by", "full_name email")
    .select("subtasks")
    .lean();

  if (!task) return [];

  return task.subtasks.map((s: any) => map(taskId, s));
};


export const getSubtaskById = async (subtaskId: string) => {

  const task = await TaskModel.findOne({ "subtasks._id": subtaskId })
    .populate("subtasks.created_by", "full_name email")
    .select("subtasks");

  if (!task) return null;

  const subtask = task.subtasks.id(subtaskId);
  return subtask ? map(task._id.toString(), subtask) : null;
};


export const updateSubtaskStatus = async (
  subtaskId: string,
  status: "TODO" | "DONE"
) => {

  const task = await TaskModel.findOne({ "subtasks._id": subtaskId });
  if (!task) return null;

  const subtask = task.subtasks.id(subtaskId);
  if (!subtask) return null;

  subtask.status = status;
  await task.save();

  return map(task._id.toString(), subtask);
};


export const deleteSubtask = async (subtaskId: string) => {

  const task = await TaskModel.findOne({ "subtasks._id": subtaskId });
  if (!task) return false;

  task.subtasks.pull({ _id: subtaskId });
  await task.save();

  return true;
};


export const getTaskSubtaskStats = async (taskId: string) => {

  const task = await TaskModel.findById(taskId).select("subtasks status").lean();
  if (!task) return { total: 0, completed: 0 };

  const total = task.subtasks.length;
  const completed = task.subtasks.filter((s: any) => s.status === "DONE").length;

  return { total, completed };
};

const map = (taskId: string, s: any) => ({
  id: s._id.toString(),
  task_id: taskId,
  title: s.title,
  description: s.description ?? null,
  status: s.status,
  created_by: s.created_by?._id?.toString?.() || s.created_by,
  created_at: s.created_at,
  updated_at: s.updated_at ?? s.created_at
});


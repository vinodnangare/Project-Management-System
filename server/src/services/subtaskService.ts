import mongoose from 'mongoose';
import { Subtask, User } from '../models/index.js';
import { Subtask as SubtaskType } from '../types/index.js';

export const createSubtask = async (
  taskId: string,
  title: string,
  description: string | null,
  createdBy: string
): Promise<SubtaskType> => {
  const subtask = await Subtask.create({
    task_id: new mongoose.Types.ObjectId(taskId),
    title,
    description: description ?? null,
    status: 'TODO',
    created_by: new mongoose.Types.ObjectId(createdBy)
  });

  return {
    id: subtask._id.toString(),
    task_id: taskId,
    title: subtask.title,
    description: subtask.description || null,
    status: subtask.status,
    created_by: createdBy,
    created_at: subtask.created_at.toISOString(),
    updated_at: subtask.updated_at.toISOString()
  };
};

export const getSubtasksByTaskId = async (taskId: string): Promise<SubtaskType[]> => {
  const subtasks = await Subtask.find({
    task_id: new mongoose.Types.ObjectId(taskId)
  })
    .populate('created_by', 'full_name email')
    .sort({ created_at: 1 });

  return subtasks.map(s => ({
    id: s._id.toString(),
    task_id: taskId,
    title: s.title,
    description: s.description || null,
    status: s.status,
    created_by: s.created_by._id.toString(),
    created_by_name: (s.created_by as any).full_name || null,
    created_by_email: (s.created_by as any).email || null,
    created_at: s.created_at.toISOString(),
    updated_at: s.updated_at.toISOString()
  }));
};

export const getSubtaskById = async (subtaskId: string): Promise<SubtaskType | null> => {
  const subtask = await Subtask.findById(subtaskId)
    .populate('created_by', 'full_name email');

  if (!subtask) return null;

  return {
    id: subtask._id.toString(),
    task_id: subtask.task_id.toString(),
    title: subtask.title,
    description: subtask.description || null,
    status: subtask.status,
    created_by: subtask.created_by._id.toString(),
    created_by_name: (subtask.created_by as any).full_name || null,
    created_by_email: (subtask.created_by as any).email || null,
    created_at: subtask.created_at.toISOString(),
    updated_at: subtask.updated_at.toISOString()
  };
};

export const updateSubtaskStatus = async (
  subtaskId: string,
  status: 'TODO' | 'DONE'
): Promise<SubtaskType | null> => {
  const updated = await Subtask.findByIdAndUpdate(
    subtaskId,
    { $set: { status } },
    { new: true }
  ).populate('created_by', 'full_name email');

  if (!updated) return null;

  return {
    id: updated._id.toString(),
    task_id: updated.task_id.toString(),
    title: updated.title,
    description: updated.description || null,
    status: updated.status,
    created_by: updated.created_by._id.toString(),
    created_by_name: (updated.created_by as any).full_name || null,
    created_by_email: (updated.created_by as any).email || null,
    created_at: updated.created_at.toISOString(),
    updated_at: updated.updated_at.toISOString()
  };
};

export const deleteSubtask = async (subtaskId: string): Promise<boolean> => {
  const result = await Subtask.findByIdAndDelete(subtaskId);
  return result !== null;
};

export const getTaskSubtaskStats = async (taskId: string): Promise<{ total: number; completed: number }> => {
  const stats = await Subtask.aggregate([
    { $match: { task_id: new mongoose.Types.ObjectId(taskId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] } }
      }
    }
  ]);

  const result = stats[0] || { total: 0, completed: 0 };
  return {
    total: result.total,
    completed: result.completed
  };
};

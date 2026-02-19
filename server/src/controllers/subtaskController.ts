import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as subtaskService from '../services/subtaskService.js';
import * as taskService from '../services/taskService.js';
import { createSubtaskSchema, updateSubtaskStatusSchema } from '../validators/subtask.js';
import { ActivityAction } from '../types/index.js';
import { NotificationService } from '../services/notificationService.js';

export const createSubtask = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Only admins can create subtasks' });
      return;
    }

    const { taskId } = req.params;

    const task = await taskService.getTaskById(taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found'
      });
      return;
    }

    const validatedData = createSubtaskSchema.parse(req.body);

    const subtask = await subtaskService.createSubtask(
      taskId,
      validatedData.title,
      validatedData.description || null,
      validatedData.created_by
    );

    res.status(201).json({
      success: true,
      data: subtask
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        data: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create subtask'
      });
    }
  }
};

export const getSubtasks = async (
  req: Request,
  res: Response
) => {
  try {
    const { taskId } = req.params;

    const task = await taskService.getTaskById(taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found'
      });
      return;
    }

    const subtasks = await subtaskService.getSubtasksByTaskId(taskId);

    res.status(200).json({
      success: true,
      data: subtasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subtasks'
    });
  }
};

export const updateSubtaskStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { taskId, subtaskId } = req.params;

    const subtask = await subtaskService.getSubtaskById(subtaskId);
    if (!subtask || subtask.task_id !== taskId) {
      res.status(404).json({
        success: false,
        error: 'Subtask not found'
      });
      return;
    }

    const oldStatus = subtask.status;
    const validatedData = updateSubtaskStatusSchema.parse(req.body);

    const updatedSubtask = await subtaskService.updateSubtaskStatus(
      subtaskId,
      validatedData.status
    );

    if (!updatedSubtask) {
      res.status(404).json({
        success: false,
        error: 'Subtask not found'
      });
      return;
    }

    await taskService.logActivity({
      task_id: taskId,
      action: ActivityAction.SUBTASK_UPDATED,
      old_value: `Subtask "${subtask.title}" status: ${oldStatus}`,
      new_value: `Subtask "${subtask.title}" status: ${validatedData.status}`,
      performed_by: req.user?.id || 'system'
    });

    const stats = await subtaskService.getTaskSubtaskStats(taskId);

    if (stats.total === stats.completed && stats.total > 0) {
      const isAdmin = req.user?.role === 'admin';
      const targetStatus = isAdmin ? 'DONE' : 'REVIEW';
      await taskService.updateTask(taskId, { status: targetStatus as any }, req.user?.id || 'system');

      // Send notification to admin (task creator) when all subtasks are completed
      if (!isAdmin) {
        try {
          const task = await taskService.getTaskById(taskId);
          if (task && task.created_by) {
            const userName = req.user?.email || 'A user';
            await NotificationService.createNotification({
              user_id: task.created_by,
              message: `${userName} has completed all subtasks for task: "${task.title}". Task is ready for review.`
            });
          }
        } catch (notificationError) {
          console.error('Failed to send task completion notification:', notificationError);
        }
      }
    } else if (stats.completed < stats.total && subtask.task_id) {
      const currentTask = await taskService.getTaskById(taskId);
      if (currentTask && currentTask.status === 'DONE') {
        await taskService.updateTask(taskId, { status: 'REVIEW' as any }, req.user?.id || 'system');
      }
    }

    res.status(200).json({
      success: true,
      data: updatedSubtask
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        data: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update subtask status'
      });
    }
  }
};

export const deleteSubtask = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Only admins can delete subtasks' });
      return;
    }

    const { taskId, subtaskId } = req.params;

    const subtask = await subtaskService.getSubtaskById(subtaskId);
    if (!subtask || subtask.task_id !== taskId) {
      res.status(404).json({
        success: false,
        error: 'Subtask not found'
      });
      return;
    }

    const success = await subtaskService.deleteSubtask(subtaskId);

    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Subtask not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { message: 'Subtask deleted successfully' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete subtask'
    });
  }
};

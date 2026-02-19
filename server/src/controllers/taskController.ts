import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as taskService from '../services/taskService.js';
import { createTaskSchema, updateTaskSchema, addCommentSchema } from '../validators/task.js';

export const getAllTasks = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;
    const assigned_to = req.query.assigned_to as string | undefined;

    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters'
      });
      return;
    }

    const result = await taskService.getAllTasks(
      { page, limit, status, priority, assigned_to },
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: result.tasks,
      meta: result.meta
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks'
    });
  }
};

export const getAssignableUsers = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Only admins can assign tasks' });
      return;
    }

    const users = await taskService.getAssignableUsers();

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching assignable users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch assignable users' });
  }
};

export const getTaskById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const task = await taskService.getTaskById(id);

    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task'
    });
  }
};

export const createTask = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({ 
        success: false, 
        error: 'Only managers/admins can create tasks' 
      });
      return;
    }

    const validatedData = createTaskSchema.parse(req.body);

    const primaryAssignee = validatedData.assignees?.[0] || validatedData.assigned_to || null;

    const task = await taskService.createTask({
      ...validatedData,
      assigned_to: primaryAssignee
    });

    if (validatedData.assignees && validatedData.assignees.length > 0) {
      const uniqueAssignees = Array.from(new Set(validatedData.assignees));
      await Promise.all(
        uniqueAssignees.map((assigneeId) =>
          taskService.addAssignee(task.id, assigneeId, req.user!.id)
        )
      );
    } else if (primaryAssignee) {
      await taskService.addAssignee(task.id, primaryAssignee, req.user.id);
    }

    const assignees = await taskService.getTaskAssignees(task.id);

    res.status(201).json({
      success: true,
      data: { ...task, assignees }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        data: error.errors
      });
    } else {
      console.error('Error creating task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create task'
      });
    }
  }
};

export const updateTask = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const performedBy = req.query.performed_by as string;

    if (!performedBy) {
      res.status(400).json({
        success: false,
        error: 'performed_by query parameter is required'
      });
      return;
    }

    const validatedData = updateTaskSchema.parse(req.body);

    const task = await taskService.updateTask(id, validatedData, performedBy);

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        data: error.errors
      });
    } else if (error instanceof Error && error.message === 'Task not found') {
      res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    } else {
      console.error('Error updating task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update task'
      });
    }
  }
};

export const deleteTask = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const performedBy = req.query.performed_by as string;

    if (!performedBy) {
      res.status(400).json({
        success: false,
        error: 'performed_by query parameter is required'
      });
      return;
    }

    const success = await taskService.deleteTask(id, performedBy);

    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Task not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { message: 'Task deleted successfully' }
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task'
    });
  }
};

export const addComment = async (
  req: Request,
  res: Response
) => {
  try {
    const { taskId } = req.params;

    const validatedData = addCommentSchema.parse(req.body);

    const comment = await taskService.addComment(
      taskId,
      validatedData.comment,
      validatedData.created_by
    );

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        data: error.errors
      });
    } else if (error instanceof Error && error.message === 'Task not found') {
      res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    } else {
      console.error('Error adding comment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add comment'
      });
    }
  }
};

export const getTaskComments = async (
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

    const comments = await taskService.getTaskComments(taskId);

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
};

export const getTaskActivities = async (
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

    const activities = await taskService.getTaskActivities(taskId);

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activities'
    });
  }
};

export const getTaskStats = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const stats = await taskService.getTaskStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
};

export const getReportSummary = async (req: Request, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const report = await taskService.getReportSummary(startDate, endDate);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
};

export const getEmployeePerformanceReport = async (req: Request, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const report = await taskService.getEmployeePerformanceReport(startDate, endDate);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error('Error generating employee report:', error);
    res.status(500).json({ success: false, error: 'Failed to generate employee report' });
  }
};

export const getTaskCompletionReport = async (req: Request, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const groupBy = req.query.groupBy as string || 'day';

    const report = await taskService.getTaskCompletionReport(startDate, endDate, groupBy);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error('Error generating completion report:', error);
    res.status(500).json({ success: false, error: 'Failed to generate completion report' });
  }
};

export const exportReport = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const reportType = req.query.type as string;
    const format = req.query.format as string || 'json';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const data = await taskService.exportReportData(reportType, startDate, endDate);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report-${reportType}-${Date.now()}.csv`);
      res.send(taskService.convertToCSV(data));
    } else {
      res.status(200).json({ success: true, data });
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ success: false, error: 'Failed to export report' });
  }
};

export const getTaskDoc = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params as { taskId: string };
    const doc = await taskService.getTaskDoc(taskId);

    if (!doc) {
      res.status(200).json({
        success: true,
        data: {
          id: null,
          task_id: taskId,
          content: '',
          created_by: null,
          updated_by: null,
          created_at: null,
          updated_at: null
        }
      });
      return;
    }

    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    console.error('Error fetching task doc:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch task docs' });
  }
};

export const upsertTaskDoc = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Only admins can edit docs' });
      return;
    }

    const { taskId } = req.params as { taskId: string };
    const content = req.body?.content ?? '';

    const doc = await taskService.upsertTaskDoc(taskId, content, req.user.id);
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    console.error('Error saving task doc:', error);
    res.status(500).json({ success: false, error: 'Failed to save task docs' });
  }
};
export const addTaskAssignee = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Only admins can assign tasks' });
      return;
    }

    const { taskId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({
        success: false,
        error: 'user_id is required'
      });
      return;
    }

    const task = await taskService.getTaskById(taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found'
      });
      return;
    }

    await taskService.addAssignee(taskId, user_id, req.user.id);

    const assignees = await taskService.getTaskAssignees(taskId);

    res.status(201).json({
      success: true,
      data: assignees
    });
  } catch (error: any) {
    if (error.message.includes('Duplicate entry')) {
      res.status(409).json({
        success: false,
        error: 'User is already assigned to this task'
      });
    } else {
      console.error('Error adding assignee:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add assignee'
      });
    }
  }
};

export const removeTaskAssignee = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Only admins can unassign tasks' });
      return;
    }

    const { taskId, userId } = req.params;

    const task = await taskService.getTaskById(taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found'
      });
      return;
    }

    await taskService.removeAssignee(taskId, userId, req.user.id);

    const assignees = await taskService.getTaskAssignees(taskId);

    res.status(200).json({
      success: true,
      data: assignees
    });
  } catch (error) {
    console.error('Error removing assignee:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove assignee'
    });
  }
};

export const getTaskAssignees = async (
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

    const assignees = await taskService.getTaskAssignees(taskId);

    res.status(200).json({
      success: true,
      data: assignees
    });
  } catch (error) {
    console.error('Error fetching assignees:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assignees'
    });
  }
};

export const getMyAssignedTasks = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const tasks = await taskService.getUserAssignedTasks(req.user.id);

    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assigned tasks'
    });
  }
};
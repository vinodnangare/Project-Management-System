import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as taskService from '../services/taskService.js';
import { createTaskSchema, updateTaskSchema, addCommentSchema } from '../validators/task.js';
import { ApiResponse } from '../types/index.js';

/**
 * Task Controller
 * 
 * Why separate controllers:
 * - Handles HTTP request/response lifecycle
 * - Validates request data using schemas
 * - Calls service layer for business logic
 * - Returns properly formatted responses
 * - Makes it easy to explain API flow to seniors
 */

/**
 * GET /tasks
 * Retrieve all tasks with optional filtering and pagination
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - status: Filter by status (TODO, IN_PROGRESS, REVIEW, DONE)
 * - priority: Filter by priority (LOW, MEDIUM, HIGH)
 * - assigned_to: Filter by assignee
 * 
 * Response: Array of tasks + pagination metadata
 */
export const getAllTasks = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
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

    // Validate pagination params
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
  res: Response<ApiResponse<any>>
): Promise<void> => {
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

/**
 * GET /tasks/:id
 * Retrieve a single task with its details
 * 
 * Response: Task object with full details
 */
export const getTaskById = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
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

/**
 * POST /tasks
 * Create a new task
 * 
 * Request Body:
 * {
 *   title: string (required)
 *   description?: string
 *   priority?: LOW | MEDIUM | HIGH (default: MEDIUM)
 *   assigned_to?: string (user ID)
 *   due_date?: ISO datetime string
 *   created_by: string (user ID, required)
 * }
 * 
 * Response: Created task object
 */
export const createTask = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
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

    // Validate request body against schema
    const validatedData = createTaskSchema.parse(req.body);

    // Use the first assignee as the primary assigned_to for backward compatibility
    const primaryAssignee = validatedData.assignees?.[0] || validatedData.assigned_to || null;

    const task = await taskService.createTask({
      ...validatedData,
      assigned_to: primaryAssignee
    });

    // Add all provided assignees (including primary) to the junction table
    if (validatedData.assignees && validatedData.assignees.length > 0) {
      const uniqueAssignees = Array.from(new Set(validatedData.assignees));
      await Promise.all(
        uniqueAssignees.map((assigneeId) =>
          taskService.addAssignee(task.id, assigneeId, req.user!.id)
        )
      );
    } else if (primaryAssignee) {
      // Ensure primary assignee is added to junction as well
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

/**
 * PATCH /tasks/:id
 * Update a task (partial update)
 * 
 * Request Body: Any subset of task fields
 * - title?: string
 * - description?: string
 * - status?: TODO | IN_PROGRESS | REVIEW | DONE
 * - priority?: LOW | MEDIUM | HIGH
 * - assigned_to?: string
 * - due_date?: ISO datetime string
 * 
 * Query Parameters:
 * - performed_by: User ID performing the update (required)
 * 
 * Response: Updated task object
 */
export const updateTask = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
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

    // Validate request body against schema
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

/**
 * DELETE /tasks/:id
 * Delete a task (soft delete)
 * 
 * Query Parameters:
 * - performed_by: User ID performing the deletion (required)
 * 
 * Response: Success message
 */
export const deleteTask = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
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

/**
 * POST /tasks/:id/comments
 * Add a comment to a task
 * 
 * Request Body:
 * {
 *   comment: string (required)
 *   created_by: string (user ID, required)
 * }
 * 
 * Response: Created comment object
 */
export const addComment = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate request body
    const validatedData = addCommentSchema.parse(req.body);

    const comment = await taskService.addComment(
      id,
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

/**
 * GET /tasks/:id/comments
 * Retrieve all comments for a task
 * 
 * Response: Array of comments ordered by newest first
 */
export const getTaskComments = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
  try {
    const { id } = req.params;

    // Verify task exists
    const task = await taskService.getTaskById(id);
    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found'
      });
      return;
    }

    const comments = await taskService.getTaskComments(id);

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

/**
 * GET /tasks/:id/activities
 * Retrieve all activities (change log) for a task
 * 
 * Response: Array of activities ordered by newest first
 */
export const getTaskActivities = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
  try {
    const { id } = req.params;

    // Verify task exists
    const task = await taskService.getTaskById(id);
    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found'
      });
      return;
    }

    const activities = await taskService.getTaskActivities(id);

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

/**
 * GET /tasks/stats
 * Retrieve task statistics for admin dashboard
 * 
 * Returns:
 * - Overall stats: Total tasks, counts by status
 * - Employee-wise stats: Task counts for each employee
 */
export const getTaskStats = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Only admins can view stats
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
/**
 * POST /tasks/:id/assignees
 * Add an assignee to a task (group task support)
 * 
 * Request Body:
 * {
 *   user_id: string (required)
 * }
 */
export const addTaskAssignee = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Only admins can assign tasks' });
      return;
    }

    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({
        success: false,
        error: 'user_id is required'
      });
      return;
    }

    // Verify task exists
    const task = await taskService.getTaskById(id);
    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found'
      });
      return;
    }

    await taskService.addAssignee(id, user_id, req.user.id);

    const assignees = await taskService.getTaskAssignees(id);

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

/**
 * DELETE /tasks/:id/assignees/:userId
 * Remove an assignee from a task
 */
export const removeTaskAssignee = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Only admins can unassign tasks' });
      return;
    }

    const { id, userId } = req.params;

    // Verify task exists
    const task = await taskService.getTaskById(id);
    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found'
      });
      return;
    }

    await taskService.removeAssignee(id, userId, req.user.id);

    const assignees = await taskService.getTaskAssignees(id);

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

/**
 * GET /tasks/:id/assignees
 * Get all assignees for a task
 */
export const getTaskAssignees = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
  try {
    const { id } = req.params;

    // Verify task exists
    const task = await taskService.getTaskById(id);
    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found'
      });
      return;
    }

    const assignees = await taskService.getTaskAssignees(id);

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

/**
 * GET /tasks/my-assigned
 * Get all tasks assigned to current user (including group tasks)
 */
export const getMyAssignedTasks = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
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
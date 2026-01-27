import { createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../api/client';

/**
 * Redux Thunks for Async Operations
 * 
 * Why thunks:
 * - Handle async API calls in Redux
 * - Dispatch actions before, during, and after API calls
 * - Cleaner than spreading API calls across components
 * - Reusable across the app
 * - Built into Redux Toolkit (@reduxjs/toolkit)
 */

/**
 * Fetch tasks with pagination and filtering
 */
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (
    options: { page?: number; limit?: number; status?: string; priority?: string; assigned_to?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.getTasks(
        options.page || 1,
        options.limit || 10,
        {
          ...(options.status && { status: options.status }),
          ...(options.priority && { priority: options.priority }),
          ...(options.assigned_to && { assigned_to: options.assigned_to })
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch tasks');
    }
  }
);

/**
 * Fetch single task details
 */
export const fetchTaskById = createAsyncThunk(
  'tasks/fetchById',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.getTaskById(taskId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch task');
    }
  }
);

/**
 * Create a new task
 */
export const createTask = createAsyncThunk(
  'tasks/create',
  async (
    taskData: {
      title: string;
      description?: string;
      priority?: string;
      assigned_to?: string;
      assignees?: string[];
      due_date?: string;
      estimated_hours?: number;
      created_by: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.createTask(taskData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create task');
    }
  }
);

/**
 * Update an existing task
 */
export const updateTask = createAsyncThunk(
  'tasks/update',
  async (
    {
      taskId,
      updates,
      performedBy
    }: {
      taskId: string;
      updates: any;
      performedBy: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.updateTask(taskId, updates, performedBy);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update task');
    }
  }
);

/**
 * Delete a task
 */
export const deleteTask = createAsyncThunk(
  'tasks/delete',
  async (
    { taskId, performedBy }: { taskId: string; performedBy: string },
    { rejectWithValue }
  ) => {
    try {
      await apiClient.deleteTask(taskId, performedBy);
      return taskId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete task');
    }
  }
);

/**
 * Fetch comments for a task
 */
export const fetchComments = createAsyncThunk(
  'comments/fetch',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.getTaskComments(taskId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch comments');
    }
  }
);

/**
 * Add comment to a task
 */
export const addTaskComment = createAsyncThunk(
  'comments/add',
  async (
    { taskId, comment, createdBy }: { taskId: string; comment: string; createdBy: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.addComment(taskId, { comment, created_by: createdBy });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add comment');
    }
  }
);

/**
 * Fetch activities for a task
 */
export const fetchActivities = createAsyncThunk(
  'activities/fetch',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.getTaskActivities(taskId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch activities');
    }
  }
);

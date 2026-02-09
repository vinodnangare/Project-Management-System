import { createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../api/client';

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

export const fetchSubtasks = createAsyncThunk(
  'subtasks/fetch',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.getSubtasks(taskId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch subtasks');
    }
  }
);

export const createSubtask = createAsyncThunk(
  'subtasks/create',
  async (
    { taskId, title, description, createdBy }: { taskId: string; title: string; description?: string; createdBy: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.createSubtask(taskId, { title, description: description || null, created_by: createdBy });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create subtask');
    }
  }
);

export const updateSubtaskStatus = createAsyncThunk(
  'subtasks/updateStatus',
  async (
    { taskId, subtaskId, status }: { taskId: string; subtaskId: string; status: 'TODO' | 'DONE' },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await apiClient.updateSubtaskStatus(taskId, subtaskId, { status });
      dispatch(fetchTaskById(taskId));
      dispatch(fetchActivities(taskId));
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update subtask status');
    }
  }
);

export const deleteSubtask = createAsyncThunk(
  'subtasks/delete',
  async (
    { taskId, subtaskId }: { taskId: string; subtaskId: string },
    { rejectWithValue }
  ) => {
    try {
      await apiClient.deleteSubtask(taskId, subtaskId);
      return subtaskId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete subtask');
    }
  }
);

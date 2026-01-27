import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';

/**
 * API Client Configuration
 * 
 * Centralized API client with JWT authentication and error handling.
 * 
 * Features:
 * - Automatic JWT token injection via interceptors
 * - Consistent error handling across all API calls
 * - Type-safe request/response interfaces
 * - Single source of truth for all backend endpoints
 * 
 * Architecture:
 * - Uses Axios for HTTP requests with interceptors
 * - Stores JWT token in localStorage (set during login/register)
 * - Adds Authorization: Bearer <token> header to all requests
 * - Provides methods for all REST API endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor to add Authorization header
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError: ApiError = {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        };
        return Promise.reject(apiError);
      }
    );
  }

  // Task endpoints
  async getTasks(page = 1, limit = 10, filters?: Record<string, string>) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    return this.client.get(`/tasks?${params}`);
  }

  async getTaskById(id: string) {
    return this.client.get(`/tasks/${id}`);
  }

  async createTask(data: any) {
    return this.client.post('/tasks', data);
  }

  async updateTask(id: string, data: any, performedBy: string) {
    return this.client.patch(`/tasks/${id}?performed_by=${performedBy}`, data);
  }

  async deleteTask(id: string, performedBy: string) {
    return this.client.delete(`/tasks/${id}?performed_by=${performedBy}`);
  }

  // Comment endpoints
  async addComment(taskId: string, data: any) {
    return this.client.post(`/tasks/${taskId}/comments`, data);
  }

  async getTaskComments(taskId: string) {
    return this.client.get(`/tasks/${taskId}/comments`);
  }

  // Activity endpoints
  async getTaskActivities(taskId: string) {
    return this.client.get(`/tasks/${taskId}/activities`);
  }

  // Users endpoints
  async getAssignableUsers() {
    return this.client.get('/tasks/assignees');
  }

  // Stats endpoint
  async getTaskStats() {
    return this.client.get('/tasks/stats');
  }

  // Time logging endpoints
  async logTime(data: { date: string; hours_worked: number; task_id: string | null; description: string | null }) {
    return this.client.post('/time-logs', data);
  }

  async getTimeLogs(startDate: string, endDate: string) {
    return this.client.get(`/time-logs/range?startDate=${startDate}&endDate=${endDate}`);
  }

  async getTimeLogForDate(date: string) {
    return this.client.get(`/time-logs/date?date=${date}`);
  }

  // Group task assignees endpoints
  async addTaskAssignee(taskId: string, userId: string) {
    return this.client.post(`/tasks/${taskId}/assignees`, { user_id: userId });
  }

  async removeTaskAssignee(taskId: string, userId: string) {
    return this.client.delete(`/tasks/${taskId}/assignees/${userId}`);
  }

  async getTaskAssignees(taskId: string) {
    return this.client.get(`/tasks/${taskId}/assignees`);
  }

  async getMyAssignedTasks() {
    return this.client.get('/tasks/my-assigned');
  }
}

export default new ApiClient();

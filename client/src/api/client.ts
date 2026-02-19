import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import toast from 'react-hot-toast';

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

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError: ApiError = {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        };
        // Show toast for rate limit errors
        if (apiError.status === 429) {
          const msg = apiError.data?.error || 'Too many requests. Please try again later.';
          toast.error(msg);
        }
        return Promise.reject(apiError);
      }
    );
  }

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

  async addComment(taskId: string, data: any) {
    return this.client.post(`/tasks/${taskId}/comments`, data);
  }

  async getTaskComments(taskId: string) {
    return this.client.get(`/tasks/${taskId}/comments`);
  }

  async getTaskActivities(taskId: string) {
    return this.client.get(`/tasks/${taskId}/activities`);
  }

  async getAssignableUsers() {
    return this.client.get('/tasks/users/assignable');
  }

  async getTaskStats() {
    return this.client.get('/tasks/stats');
  }

  async logTime(data: { date: string; hours_worked: number; task_id: string | null; description: string | null }) {
    return this.client.post('/time-logs', data);
  }

  async getTimeLogs(startDate: string, endDate: string) {
    return this.client.get(`/time-logs/range?startDate=${startDate}&endDate=${endDate}`);
  }

  async getTimeLogForDate(date: string) {
    return this.client.get(`/time-logs/date?date=${date}`);
  }

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
    return this.client.get('/tasks/assigned/me');
  }

  async getSubtasks(taskId: string) {
    return this.client.get(`/tasks/${taskId}/subtasks`);
  }

  async createSubtask(taskId: string, data: any) {
    return this.client.post(`/tasks/${taskId}/subtasks`, data);
  }

  async updateSubtaskStatus(taskId: string, subtaskId: string, data: any) {
    return this.client.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, data);
  }

  async deleteSubtask(taskId: string, subtaskId: string) {
    return this.client.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
  }

  async updateProfile(data: { full_name?: string; mobile_number?: string | null }) {
    return this.client.patch('/auth/profile', data);
  }
}

export default new ApiClient();

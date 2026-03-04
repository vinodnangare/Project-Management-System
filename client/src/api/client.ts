import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

// Store dispatch reference for logout handling
let storeDispatch: unknown = null;

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
// Queue of failed requests to retry after token refresh
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig;
}> = [];

export const setDispatchForClient = (dispatch: unknown) => {
  storeDispatch = dispatch;
};

/**
 * Process the queue of failed requests after token refresh
 */
const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

/**
 * Attempt to refresh the access token
 */
const attemptTokenRefresh = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem('refreshtoken');
  
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken
    });

    if (response.data?.success && response.data?.data) {
      localStorage.setItem('access token', response.data.data.accessToken);
      if (response.data.data.refreshToken) {
        localStorage.setItem('refreshtoken', response.data.data.refreshToken);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Handle logout - clear all tokens and redirect
 */
const handleLogout = async () => {
  localStorage.removeItem('access token');
  localStorage.removeItem('refreshtoken');
  localStorage.removeItem('user');

  toast.error('Session expired. Please login again.', {
    duration: 3000,
    position: 'top-right',
  });

  if (storeDispatch) {
    const { logout } = await import('../store/slices/authSlice');
    (storeDispatch as (action: unknown) => void)(logout());
  }

  setTimeout(() => {
    window.location.href = '/login';
  }, 500);
};

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
        const token = localStorage.getItem('access token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        const apiError: ApiError = {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        };

        // Handle 401 Unauthorized (token expired or invalid)
        if (apiError.status === 401 && originalRequest && !originalRequest._retry) {
          if (isRefreshing) {
            // Queue the request while another refresh is in progress
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject, config: originalRequest });
            }).then(() => {
              // Update token in header and retry
              const newToken = localStorage.getItem('access token');
              if (newToken) {
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              }
              return this.client(originalRequest);
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const refreshSuccess = await attemptTokenRefresh();
            
            if (refreshSuccess) {
              const newToken = localStorage.getItem('access token');
              if (newToken) {
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              }
              processQueue();
              return this.client(originalRequest);
            } else {
              processQueue(error);
              await handleLogout();
            }
          } finally {
            isRefreshing = false;
          }
        }
        // Show toast for rate limit errors
        else if (apiError.status === 429) {
          const msg = (apiError.data as { error?: string })?.error || 'Too many requests. Please try again later.';
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

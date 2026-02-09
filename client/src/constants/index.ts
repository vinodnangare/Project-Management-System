export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as const;
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export const STATUS_COLORS: Record<string, string> = {
  'TODO': '#FFA500',
  'IN_PROGRESS': '#4A90E2',
  'REVIEW': '#9B59B6',
  'DONE': '#27AE60'
};

export const PRIORITY_COLORS: Record<string, string> = {
  'LOW': '#27AE60',
  'MEDIUM': '#F39C12',
  'HIGH': '#E74C3C'
};

export const TAB_TYPES = ['details', 'subtasks', 'comments', 'activity'] as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register'
  },
  TASKS: {
    LIST: '/api/tasks',
    CREATE: '/api/tasks',
    GET: (id: string) => `/api/tasks/${id}`,
    UPDATE: (id: string) => `/api/tasks/${id}`,
    DELETE: (id: string) => `/api/tasks/${id}`,
    STATS: '/api/tasks/stats',
    ASSIGNABLE_USERS: '/api/tasks/users/assignable',
    ASSIGNED_TO_ME: '/api/tasks/assigned/me'
  },
  TIME_LOGS: {
    LOG: '/api/time-logs',
    GET_RANGE: '/api/time-logs/range'
  },
  COMMENTS: {
    LIST: (taskId: string) => `/api/tasks/${taskId}/comments`,
    CREATE: (taskId: string) => `/api/tasks/${taskId}/comments`
  },
  ACTIVITIES: {
    LIST: (taskId: string) => `/api/tasks/${taskId}/activities`
  }
};

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100
};

export const DEBOUNCE_DELAY = 300;
export const TOAST_DURATION = 3000;

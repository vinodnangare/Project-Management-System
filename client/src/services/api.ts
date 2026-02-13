import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'employee';
  is_active: boolean;
  created_at: string;
  mobile_number?: string | null;
  profile_image_url?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_email?: string;
  assigned_to_user?: {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
  } | null;
  due_date?: string;
  estimated_hours?: number;
  created_by: string;
  created_by_user?: {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
  } | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  created_by_name?: string;
  created_by_email?: string;
  assignees?: any[];
}

export interface Comment {
  id: string;
  task_id: string;
  comment: string;
  created_by: string;
  created_by_user?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  created_at: string;
  created_by_name?: string;
  created_by_email?: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  description?: string | null;
  status: 'TODO' | 'DONE';
  created_by: string;
  created_by_name?: string;
  created_by_email?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  task_id: string;
  action: string;
  old_value?: string;
  new_value?: string;
  performed_by: string;
  performed_by_user?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  created_at: string;
  performed_by_name?: string;
  performed_by_email?: string;
}

export interface TaskDoc {
  id?: string | null;
  task_id: string;
  content: string;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TimeLog {
  id: string;
  user_id: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  date: string;
  hours_worked: number;
  task_id?: string;
  description?: string;
  created_at: string;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      // Get token from Redux store (source of truth) instead of localStorage
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Task', 'Comment', 'Activity', 'Subtask', 'TimeLog', 'Stats', 'User', 'Profile', 'Doc'],
  endpoints: (builder) => ({
    // Auth Endpoints
    login: builder.mutation<{ user: User; token: string }, { email: string; password: string }>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: { success: boolean; data: { user: User; token: string } }) => response.data,
      invalidatesTags: ['Task', 'TimeLog', 'Comment', 'Activity', 'Stats', 'Profile'],
    }),
    
    register: builder.mutation<{ user: User; token: string }, { email: string; password: string; password_confirm: string; full_name: string; role?: 'manager' | 'employee' }>({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: { user: User; token: string } }) => response.data,
      invalidatesTags: ['Task', 'TimeLog', 'Comment', 'Activity', 'Stats', 'Profile'],
    }),

    getProfile: builder.query<User, undefined>({
      query: () => ({
        url: '/auth/profile',
        method: 'GET',
      }),
      transformResponse: (response: { success: boolean; data: User }) => response.data,
      providesTags: ['Profile'],
    }),

    updateProfile: builder.mutation<User, { full_name?: string; mobile_number?: string | null }>({
      query: (data) => ({
        url: '/auth/profile',
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: User }) => response.data,
      invalidatesTags: ['Profile'],
    }),

    uploadProfileImage: builder.mutation<User, FormData>({
      query: (formData) => ({
        url: '/auth/profile/image/',
        method: 'POST',
        body: formData,
        prepareHeaders: (headers: Headers) => {
          const token = localStorage.getItem('token');
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          // Remove Content-Type to let browser set it with boundary for multipart
          headers.delete('Content-Type');
          return headers;
        },
      }),
      transformResponse: (response: { success: boolean; data: User }) => response.data,
      invalidatesTags: ['Profile'],
    }),

    deleteEmployee: builder.mutation<void, string>({
      query: (employeeId) => ({
        url: `/auth/employees/${employeeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Stats'],
    }),

    // Task Endpoints
    getTasks: builder.query<{ tasks: Task[]; meta: any }, { page?: number; limit?: number; status?: string; priority?: string; assigned_to?: string }>({
      query: ({ page = 1, limit = 10, status, priority, assigned_to }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(status && { status }),
          ...(priority && { priority }),
          ...(assigned_to && { assigned_to }),
        });
        return `/tasks?${params}`;
      },
      transformResponse: (response: { success: boolean; data: Task[]; meta: any }) => ({
        tasks: response.data,
        meta: response.meta,
      }),
      providesTags: (result) =>
        result?.tasks?.length
          ? [
              ...result.tasks.map(({ id }) => ({ type: 'Task' as const, id })),
              { type: 'Task', id: 'LIST' },
            ]
          : [{ type: 'Task', id: 'LIST' }],
    }),

    getTaskById: builder.query<Task, string>({
      query: (id) => `/tasks/${id}`,
      transformResponse: (response: { success: boolean; data: Task }) => response.data,
      providesTags: (result, error, id) => [{ type: 'Task', id }],
    }),

    getTaskDoc: builder.query<TaskDoc, string>({
      query: (taskId) => `/tasks/${taskId}/docs/`,
      transformResponse: (response: { success: boolean; data: TaskDoc }) => response.data,
      providesTags: (result, error, taskId) => [{ type: 'Doc', id: taskId }],
    }),

    upsertTaskDoc: builder.mutation<TaskDoc, { taskId: string; content: string }>({
      query: ({ taskId, content }) => ({
        url: `/tasks/${taskId}/docs/`,
        method: 'PUT',
        body: { content },
      }),
      transformResponse: (response: { success: boolean; data: TaskDoc }) => response.data,
      invalidatesTags: (result, error, { taskId }) => [{ type: 'Doc', id: taskId }],
    }),

    createTask: builder.mutation<Task, Partial<Task> & { created_by: string; assignees?: string[] }>({
      query: (data) => ({
        url: '/tasks/',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: Task }) => response.data,
      invalidatesTags: [{ type: 'Task', id: 'LIST' }, 'Stats'],
    }),

    updateTask: builder.mutation<Task, { id: string; updates: Partial<Task>; performedBy: string }>({
      query: ({ id, updates, performedBy }) => ({
        url: `/tasks/${id}/?performed_by=${performedBy}`,
        method: 'PATCH',
        body: updates,
      }),
      transformResponse: (response: { success: boolean; data: Task }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
        { type: 'Activity', id },
      ],
    }),

    deleteTask: builder.mutation<void, { id: string; performedBy: string }>({
      query: ({ id, performedBy }) => ({
        url: `/tasks/${id}?performed_by=${performedBy}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),

    getMyAssignedTasks: builder.query<Task[], void>({
      query: () => '/tasks/assigned/me',
      transformResponse: (response: { success: boolean; data: Task[] }) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Task' as const, id })),
              { type: 'Task', id: 'MY_TASKS' },
            ]
          : [{ type: 'Task', id: 'MY_TASKS' }],
    }),

    getAssignableUsers: builder.query<User[], void>({
      query: () => '/tasks/users/assignable',
      transformResponse: (response: { success: boolean; data: User[] }) => response.data,
      providesTags: ['User'],
    }),

    // Task Assignees
    getTaskAssignees: builder.query<User[], string>({
      query: (taskId) => `/tasks/${taskId}/assignees`,
      transformResponse: (response: { success: boolean; data: User[] }) => response.data,
      providesTags: (result, error, taskId) => [{ type: 'Task', id: taskId }],
    }),

    addTaskAssignee: builder.mutation<User[], { taskId: string; userId: string }>({
      query: ({ taskId, userId }) => ({
        url: `/tasks/${taskId}/assignees`,
        method: 'POST',
        body: { user_id: userId },
      }),
      transformResponse: (response: { success: boolean; data: User[] }) => response.data,
      invalidatesTags: (result, error, { taskId }) => [{ type: 'Task', id: taskId }],
    }),

    removeTaskAssignee: builder.mutation<User[], { taskId: string; userId: string }>({
      query: ({ taskId, userId }) => ({
        url: `/tasks/${taskId}/assignees/${userId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: { success: boolean; data: User[] }) => response.data,
      invalidatesTags: (result, error, { taskId }) => [{ type: 'Task', id: taskId }],
    }),

    // Comments
    getTaskComments: builder.query<Comment[], string>({
      query: (taskId) => `/tasks/${taskId}/comments/`,
      transformResponse: (response: { success: boolean; data: Comment[] }) => response.data,
      providesTags: (result, error, taskId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Comment' as const, id })),
              { type: 'Comment', id: taskId },
            ]
          : [{ type: 'Comment', id: taskId }],
    }),

    addComment: builder.mutation<Comment, { taskId: string; comment: string; created_by: string }>({
      query: ({ taskId, comment, created_by }) => ({
        url: `/tasks/${taskId}/comments/`,
        method: 'POST',
        body: { comment, created_by },
      }),
      transformResponse: (response: { success: boolean; data: Comment }) => response.data,
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'Comment', id: taskId },
        { type: 'Activity', id: taskId },
      ],
    }),

    // Activities
    getTaskActivities: builder.query<Activity[], string>({
      query: (taskId) => `/tasks/${taskId}/activities`,
      transformResponse: (response: { success: boolean; data: Activity[] }) => response.data,
      providesTags: (result, error, taskId) => [{ type: 'Activity', id: taskId }],
    }),

    // Subtasks
    getSubtasks: builder.query<Subtask[], string>({
      query: (taskId) => `/tasks/${taskId}/subtasks/`,
      transformResponse: (response: { success: boolean; data: Subtask[] }) => response.data,
      providesTags: (result, error, taskId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Subtask' as const, id })),
              { type: 'Subtask', id: taskId },
            ]
          : [{ type: 'Subtask', id: taskId }],
    }),

    createSubtask: builder.mutation<Subtask, { taskId: string; title: string; description?: string | null; created_by: string }>({
      query: ({ taskId, title, description, created_by }) => ({
        url: `/tasks/${taskId}/subtasks/`,
        method: 'POST',
        body: { title, description, created_by },
      }),
      transformResponse: (response: { success: boolean; data: Subtask }) => response.data,
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'Subtask', id: taskId },
        { type: 'Activity', id: taskId },
      ],
    }),

    updateSubtaskStatus: builder.mutation<Subtask, { taskId: string; subtaskId: string; status: 'TODO' | 'DONE' }>({
      query: ({ taskId, subtaskId, status }) => ({
        url: `/tasks/${taskId}/subtasks/${subtaskId}/`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (response: { success: boolean; data: Subtask }) => response.data,
      invalidatesTags: (result, error, { taskId, subtaskId }) => [
        { type: 'Subtask', id: taskId },
        { type: 'Subtask', id: subtaskId },
        { type: 'Task', id: taskId },
        { type: 'Activity', id: taskId },
      ],
    }),

    deleteSubtask: builder.mutation<void, { taskId: string; subtaskId: string }>({
      query: ({ taskId, subtaskId }) => ({
        url: `/tasks/${taskId}/subtasks/${subtaskId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { taskId, subtaskId }) => [
        { type: 'Subtask', id: taskId },
        { type: 'Subtask', id: subtaskId },
        { type: 'Activity', id: taskId },
      ],
    }),

    // Time Logs
    logTime: builder.mutation<TimeLog, { date: string; hours_worked: number; task_id?: string | null; description?: string | null }>({
      query: (data) => ({
        url: '/time-logs/',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: TimeLog }) => response.data,
      invalidatesTags: ['TimeLog'],
    }),

    getTimeLogs: builder.query<TimeLog[], { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) => `/time-logs/range?startDate=${startDate}&endDate=${endDate}`,
      transformResponse: (response: { success: boolean; data: TimeLog[] }) => response.data,
      providesTags: ['TimeLog'],
    }),

    getTimeLogForDate: builder.query<TimeLog | null, string>({
      query: (date) => `/time-logs/date?date=${date}`,
      transformResponse: (response: { success: boolean; data: TimeLog | null }) => response.data,
      providesTags: ['TimeLog'],
    }),

    // Stats
    getTaskStats: builder.query<any, void>({
      query: () => '/tasks/stats/',
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      providesTags: ['Stats'],
    }),

    // Reports
    getReportSummary: builder.query<any, { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) => `/tasks/reports/summary/?startDate=${startDate}&endDate=${endDate}`,
      transformResponse: (response: { success: boolean; data: any }) => response.data,
    }),

    getEmployeePerformance: builder.query<any, { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) => `/tasks/reports/employee-performance/?startDate=${startDate}&endDate=${endDate}`,
      transformResponse: (response: { success: boolean; data: any }) => response.data,
    }),

    getTaskCompletion: builder.query<any, { startDate: string; endDate: string; groupBy: string }>({
      query: ({ startDate, endDate, groupBy }) => `/tasks/reports/task-completion/?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`,
      transformResponse: (response: { success: boolean; data: any }) => response.data,
    }),

    // Lead Stats
    getLeadStats: builder.query<any, void>({
      query: () => '/leads/stats',
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      providesTags: ['Stats'],
    }),

    getLeads: builder.query<{ leads: any[]; meta: any }, { page?: number; limit?: number; stage?: string; source?: string; owner?: string }>({
      query: ({ page = 1, limit = 100, stage, source, owner }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(stage && { stage }),
          ...(source && { source }),
          ...(owner && { owner }),
        });
        return `/leads?${params}`;
      },
      transformResponse: (response: { success: boolean; data: any[]; meta: any }) => ({
        leads: response.data,
        meta: response.meta,
      }),
      providesTags: ['Task'],
    }),

    getLeadOwners: builder.query<any[], void>({
      query: () => '/leads/owners',
      transformResponse: (response: { success: boolean; data: any[] }) => response.data,
      providesTags: ['Task'],
    }),

    updateLeadStage: builder.mutation<any, { leadId: string; stage: string }>({
      query: ({ leadId, stage }) => ({
        url: `/leads/${leadId}/stage`,
        method: 'PATCH',
        body: { stage },
      }),
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      invalidatesTags: ['Task', 'Stats'],
    }),

    getLeadById: builder.query<any, string>({
      query: (leadId) => `/leads/${leadId}`,
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      providesTags: ['Task'],
    }),

    createLead: builder.mutation<any, any>({
      query: (leadData) => ({
        url: '/leads',
        method: 'POST',
        body: leadData,
      }),
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      invalidatesTags: ['Task', 'Stats'],
    }),

    updateLead: builder.mutation<any, { leadId: string; updates: any }>({
      query: ({ leadId, updates }) => ({
        url: `/leads/${leadId}`,
        method: 'PUT',
        body: updates,
      }),
      transformResponse: (response: { success: boolean; data: any }) => response.data,
      invalidatesTags: ['Task', 'Stats'],
    }),

    deleteLead: builder.mutation<void, string>({
      query: (leadId) => ({
        url: `/leads/${leadId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task', 'Stats'],
    }),
  }),
});

export const {
  // Auth
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadProfileImageMutation,
  useDeleteEmployeeMutation,
  
  // Tasks
  useGetTasksQuery,
  useLazyGetTasksQuery,
  useGetTaskByIdQuery,
  useLazyGetTaskByIdQuery,
  useGetTaskDocQuery,
  useUpsertTaskDocMutation,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetMyAssignedTasksQuery,
  useGetAssignableUsersQuery,
  
  // Task Assignees
  useGetTaskAssigneesQuery,
  useAddTaskAssigneeMutation,
  useRemoveTaskAssigneeMutation,
  
  // Comments
  useGetTaskCommentsQuery,
  useAddCommentMutation,
  
  // Activities
  useGetTaskActivitiesQuery,
  
  // Subtasks
  useGetSubtasksQuery,
  useCreateSubtaskMutation,
  useUpdateSubtaskStatusMutation,
  useDeleteSubtaskMutation,
  
  // Time Logs
  useLogTimeMutation,
  useGetTimeLogsQuery,
  useGetTimeLogForDateQuery,
  
  // Stats
  useGetTaskStatsQuery,
  
  // Reports
  useGetReportSummaryQuery,
  useGetEmployeePerformanceQuery,
  useGetTaskCompletionQuery,
  
  // Leads
  useGetLeadStatsQuery,
  useGetLeadsQuery,
  useGetLeadOwnersQuery,
  useCreateLeadMutation,
  useUpdateLeadStageMutation,
  useGetLeadByIdQuery,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
} = api;

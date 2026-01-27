import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchTasks, fetchTaskById, createTask, updateTask, deleteTask } from '../thunks';

/**
 * Task Slice
 * 
 * Redux slice for managing task state
 * Combines actions and reducers into a single file
 * Uses Immer for immutable updates with mutable syntax
 */

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigned_to: string | null;
  assigned_to_name?: string | null;
  assigned_to_email?: string | null;
  created_by: string;
  created_by_name?: string | null;
  created_by_email?: string | null;
  due_date: string | null;
  estimated_hours?: number | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface TasksState {
  items: Task[];
  selectedTaskId: string | null;
  loading: boolean;
  error: string | null;
  pagination: PaginationMeta;
  filters: {
    status?: string;
    priority?: string;
    assigned_to?: string;
  };
}

const initialState: TasksState = {
  items: [],
  selectedTaskId: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  },
  filters: {}
};

/**
 * Tasks Slice
 * Contains all task-related state and reducers
 */
const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // Single task
    setSelectedTask: (state, action: PayloadAction<string | null>) => {
      state.selectedTaskId = action.payload;
    },

    // Pagination and filtering
    setPagination: (state, action: PayloadAction<Partial<PaginationMeta>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    setFilters: (state, action: PayloadAction<Record<string, string | undefined>>) => {
      state.filters = action.payload;
    },

    // Reset
    resetTasks: () => initialState
  },
  extraReducers: (builder) => {
    // Fetch tasks
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.pagination = action.payload.meta;
        state.error = null;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch single task
    builder
      .addCase(fetchTaskById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create task
    builder
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.pagination.total += 1;
        state.error = null;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update task
    builder
      .addCase(updateTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete task
    builder
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((t) => t.id !== action.payload);
        state.pagination.total -= 1;
        if (state.selectedTaskId === action.payload) {
          state.selectedTaskId = null;
        }
        state.error = null;
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setSelectedTask, setPagination, setFilters, resetTasks } = tasksSlice.actions;

export default tasksSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

interface EmployeeStats {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  todo: number;
  in_progress: number;
  review: number;
  done: number;
  total: number;
}

interface OverallStats {
  total_tasks: number;
  todo_tasks: number;
  in_progress_tasks: number;
  review_tasks: number;
  done_tasks: number;
  total_employees: number;
}

interface StatsState {
  overall: OverallStats | null;
  employees: EmployeeStats[];
  loading: boolean;
  error: string | null;
}

const initialState: StatsState = {
  overall: null,
  employees: [],
  loading: false,
  error: null
};

export const fetchTaskStats = createAsyncThunk(
  'stats/fetchTaskStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getTaskStats();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch statistics');
    }
  }
);

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaskStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskStats.fulfilled, (state, action) => {
        state.loading = false;
        state.overall = action.payload.overall;
        state.employees = action.payload.employees;
      })
      .addCase(fetchTaskStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearError } = statsSlice.actions;
export default statsSlice.reducer;

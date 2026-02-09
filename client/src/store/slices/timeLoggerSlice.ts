import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

interface TimeLog {
  id: string;
  user_id: string;
  task_id: string | null;
  hours_worked: number;
  date: string;
  description: string | null;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
}

interface TimeLoggerState {
  date: string;
  hoursWorked: string;
  taskId: string;
  description: string;
  tasks: Task[];
  timeLogs: TimeLog[];
  loading: boolean;
  error: string;
  success: string;
}

const initialState: TimeLoggerState = {
  date: new Date().toISOString().split('T')[0],
  hoursWorked: '',
  taskId: '',
  description: '',
  tasks: [],
  timeLogs: [],
  loading: false,
  error: '',
  success: ''
};

export const fetchTasks = createAsyncThunk(
  'timeLogger/fetchTasks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getTasks(1, 100);
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch tasks');
    }
  }
);

export const fetchTimeLogs = createAsyncThunk(
  'timeLogger/fetchTimeLogs',
  async (_, { rejectWithValue }) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();
      
      const response = await apiClient.getTimeLogs(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch time logs');
    }
  }
);

export const logTimeEntry = createAsyncThunk(
  'timeLogger/logTimeEntry',
  async (payload: { date: string; hours: string; taskId: string; description: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.logTime({
        task_id: payload.taskId || null,
        hours_worked: parseFloat(payload.hours),
        date: payload.date,
        description: payload.description || null
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to log time');
    }
  }
);

const timeLoggerSlice = createSlice({
  name: 'timeLogger',
  initialState,
  reducers: {
    setDate: (state, action) => {
      state.date = action.payload;
    },
    setHoursWorked: (state, action) => {
      state.hoursWorked = action.payload;
    },
    setTaskId: (state, action) => {
      state.taskId = action.payload;
    },
    setDescription: (state, action) => {
      state.description = action.payload;
    },
    clearMessages: (state) => {
      state.error = '';
      state.success = '';
    },
    resetForm: (state) => {
      state.hoursWorked = '';
      state.taskId = '';
      state.description = '';
      state.success = '';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTimeLogs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTimeLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.timeLogs = action.payload;
      })
      .addCase(fetchTimeLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logTimeEntry.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(logTimeEntry.fulfilled, (state) => {
        state.loading = false;
        state.success = 'Time logged successfully!';
        state.hoursWorked = '';
        state.taskId = '';
        state.description = '';
      })
      .addCase(logTimeEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setDate, setHoursWorked, setTaskId, setDescription, clearMessages, resetForm } = timeLoggerSlice.actions;
export default timeLoggerSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

interface EmployeeStats {
  totalTasks: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksTodo: number;
  tasksInReview: number;
  tasksOverdue: number;
  tasksDueToday: number;
  hoursWorked: number;
  completionRate: number;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: string;
  }>;
}

interface EmployeeDashboardState {
  stats: EmployeeStats | null;
  loading: boolean;
  error: string;
}

const initialState: EmployeeDashboardState = {
  stats: null,
  loading: true,
  error: ''
};

export const fetchEmployeeStats = createAsyncThunk(
  'employeeDashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getTasks(1, 100);
      const allTasks = response.data.data || [];
      
      const stats: EmployeeStats = {
        totalTasks: allTasks.length,
        tasksCompleted: allTasks.filter((t: any) => t.status === 'DONE').length,
        tasksInProgress: allTasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
        tasksTodo: allTasks.filter((t: any) => t.status === 'TODO').length,
        tasksInReview: allTasks.filter((t: any) => t.status === 'REVIEW').length,
        tasksOverdue: 0,
        tasksDueToday: 0,
        hoursWorked: 0,
        completionRate: 0,
        upcomingDeadlines: []
      };

      const completionRate = stats.totalTasks > 0 ? (stats.tasksCompleted / stats.totalTasks) * 100 : 0;
      stats.completionRate = Math.round(completionRate);

      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const endDate = new Date();
        
        const timeLogs = await apiClient.getTimeLogs(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
        const logs = timeLogs.data.data || [];
        stats.hoursWorked = parseFloat(logs.reduce((sum: number, log: any) => sum + Number(log.hours_worked), 0).toFixed(1));
      } catch (err) {
        stats.hoursWorked = 0;
      }

      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch statistics');
    }
  }
);

const employeeDashboardSlice = createSlice({
  name: 'employeeDashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeStats.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchEmployeeStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchEmployeeStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export default employeeDashboardSlice.reducer;

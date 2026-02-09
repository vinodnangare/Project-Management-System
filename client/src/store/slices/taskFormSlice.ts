import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

interface Assignee {
  id: string;
  full_name: string;
  email: string;
}

interface TaskFormState {
  employees: Assignee[];
  employeesError: string;
  formError: string;
  loading: boolean;
}

const initialState: TaskFormState = {
  employees: [],
  employeesError: '',
  formError: '',
  loading: false
};

export const fetchAssignableUsers = createAsyncThunk(
  'taskForm/fetchAssignableUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getAssignableUsers();
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch users');
    }
  }
);

const taskFormSlice = createSlice({
  name: 'taskForm',
  initialState,
  reducers: {
    clearFormError: (state) => {
      state.formError = '';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignableUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAssignableUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(fetchAssignableUsers.rejected, (state, action) => {
        state.loading = false;
        state.employeesError = action.payload as string;
      });
  }
});

export const { clearFormError } = taskFormSlice.actions;
export default taskFormSlice.reducer;

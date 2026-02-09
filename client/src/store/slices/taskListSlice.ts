import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

interface Filters {
  status?: string;
  priority?: string;
  assignedTo?: string;
}

interface TaskListState {
  filters: Filters;
  page: number;
  limit: number;
}

const initialState: TaskListState = {
  filters: {},
  page: 1,
  limit: 10
};

const taskListSlice = createSlice({
  name: 'taskList',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setLimit: (state, action) => {
      state.limit = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
      state.page = 1;
    }
  }
});

export const { setFilters, setPage, setLimit, clearFilters } = taskListSlice.actions;
export default taskListSlice.reducer;

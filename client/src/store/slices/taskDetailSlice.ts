import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

interface Assignee {
  id: string;
  full_name: string;
  email: string;
}

interface TaskDetailState {
  activeTab: 'details' | 'subtasks' | 'comments' | 'activity';
  newComment: string;
  isUpdatingStatus: boolean;
  showDeleteConfirm: boolean;
  assignees: Assignee[];
  availableUsers: Assignee[];
  loadingAssignees: boolean;
}

const initialState: TaskDetailState = {
  activeTab: 'details',
  newComment: '',
  isUpdatingStatus: false,
  showDeleteConfirm: false,
  assignees: [],
  availableUsers: [],
  loadingAssignees: false
};

export const fetchAssignees = createAsyncThunk(
  'taskDetail/fetchAssignees',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.getTaskAssignees(taskId);
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch assignees');
    }
  }
);

export const fetchAvailableUsers = createAsyncThunk(
  'taskDetail/fetchAvailableUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getAssignableUsers();
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch users');
    }
  }
);

const taskDetailSlice = createSlice({
  name: 'taskDetail',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setNewComment: (state, action) => {
      state.newComment = action.payload;
    },
    setIsUpdatingStatus: (state, action) => {
      state.isUpdatingStatus = action.payload;
    },
    setShowDeleteConfirm: (state, action) => {
      state.showDeleteConfirm = action.payload;
    },
    clearNewComment: (state) => {
      state.newComment = '';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignees.pending, (state) => {
        state.loadingAssignees = true;
      })
      .addCase(fetchAssignees.fulfilled, (state, action) => {
        state.loadingAssignees = false;
        state.assignees = action.payload;
      })
      .addCase(fetchAssignees.rejected, (state) => {
        state.loadingAssignees = false;
      })
      .addCase(fetchAvailableUsers.pending, (state) => {
        state.loadingAssignees = true;
      })
      .addCase(fetchAvailableUsers.fulfilled, (state, action) => {
        state.loadingAssignees = false;
        state.availableUsers = action.payload;
      })
      .addCase(fetchAvailableUsers.rejected, (state) => {
        state.loadingAssignees = false;
      });
  }
});

export const { setActiveTab, setNewComment, setIsUpdatingStatus, setShowDeleteConfirm, clearNewComment } = taskDetailSlice.actions;
export default taskDetailSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';
import { fetchSubtasks, createSubtask, updateSubtaskStatus, deleteSubtask } from '../thunks';

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'DONE';
  created_by: string;
  created_by_name?: string | null;
  created_by_email?: string | null;
  created_at: string;
  updated_at: string;
}

interface SubtasksState {
  items: Subtask[];
  loading: boolean;
  error: string | null;
}

const initialState: SubtasksState = {
  items: [],
  loading: false,
  error: null
};

const subtasksSlice = createSlice({
  name: 'subtasks',
  initialState,
  reducers: {
    resetSubtasks: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubtasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubtasks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchSubtasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createSubtask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubtask.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
        state.error = null;
      })
      .addCase(createSubtask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(updateSubtaskStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSubtaskStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateSubtaskStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(deleteSubtask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSubtask.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteSubtask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { resetSubtasks } = subtasksSlice.actions;

export default subtasksSlice.reducer;

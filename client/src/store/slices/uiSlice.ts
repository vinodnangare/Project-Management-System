import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

/**
 * UI Slice
 * Manages UI state (loading, modals, notifications, etc.)
 */

interface UIState {
  selectedTaskId: string | null;
  showTaskForm: boolean;
  showDeleteConfirm: boolean;
  deleteTargetId: string | null;
}

const initialState: UIState = {
  selectedTaskId: null,
  showTaskForm: false,
  showDeleteConfirm: false,
  deleteTargetId: null
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSelectedTask: (state, action: PayloadAction<string | null>) => {
      state.selectedTaskId = action.payload;
    },

    openTaskForm: (state) => {
      state.showTaskForm = true;
    },

    closeTaskForm: (state) => {
      state.showTaskForm = false;
    },

    openDeleteConfirm: (state, action: PayloadAction<string>) => {
      state.showDeleteConfirm = true;
      state.deleteTargetId = action.payload;
    },

    closeDeleteConfirm: (state) => {
      state.showDeleteConfirm = false;
      state.deleteTargetId = null;
    },

    resetUI: () => initialState
  }
});

export const {
  setSelectedTask,
  openTaskForm,
  closeTaskForm,
  openDeleteConfirm,
  closeDeleteConfirm,
  resetUI
} = uiSlice.actions;

export default uiSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';
import { fetchComments, addTaskComment } from '../thunks';

export interface TaskComment {
  id: string;
  task_id: string;
  comment: string;
  created_by: string;
  created_at: string;
}

interface CommentsState {
  items: TaskComment[];
  loading: boolean;
  error: string | null;
}

const initialState: CommentsState = {
  items: [],
  loading: false,
  error: null
};

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    resetComments: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(addTaskComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTaskComment.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.error = null;
      })
      .addCase(addTaskComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { resetComments } = commentsSlice.actions;

export default commentsSlice.reducer;

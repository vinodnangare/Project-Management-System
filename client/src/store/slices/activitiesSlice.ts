import { createSlice } from '@reduxjs/toolkit';
import { fetchActivities } from '../thunks';

export interface TaskActivity {
  id: string;
  task_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  performed_by: string;
  created_at: string;
}

interface ActivitiesState {
  items: TaskActivity[];
  loading: boolean;
  error: string | null;
}

const initialState: ActivitiesState = {
  items: [],
  loading: false,
  error: null
};

const activitiesSlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    resetActivities: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { resetActivities } = activitiesSlice.actions;

export default activitiesSlice.reducer;

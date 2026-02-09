import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';
import { updateUser } from './authSlice';

export interface ProfileState {
  full_name: string;
  mobile_number: string | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: ProfileState = {
  full_name: '',
  mobile_number: null,
  loading: false,
  error: null,
  success: false
};

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (
    data: { full_name?: string; mobile_number?: string | null },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await apiClient.updateProfile(data);
      // Also update the auth slice with new user data
      dispatch(updateUser(response.data.data));
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to update profile'
      );
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.full_name = action.payload.full_name;
        state.mobile_number = action.payload.mobile_number || null;
        state.success = true;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  }
});

export const { clearError, clearSuccess } = profileSlice.actions;
export default profileSlice.reducer;

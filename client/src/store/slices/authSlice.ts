import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'employee';
  is_active: boolean;
  created_at: string;
  mobile_number?: string | null;
  profile_image_url?: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const loadUserFromStorage = (): User | null => {
  try {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
};

const savedUser = loadUserFromStorage();
const savedToken = (() => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
})();

const initialState: AuthState = {
  user: savedUser,
  token: savedToken,
  loading: false,
  error: null,
  isAuthenticated: !!savedUser && !!savedToken
};


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    }
  },
  extraReducers: () => {}
});

export const { setCredentials, logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;

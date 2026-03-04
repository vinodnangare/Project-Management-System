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
  refreshToken: string | null;
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
    return localStorage.getItem('access token');
  } catch {
    return null;
  }
})();
const savedRefreshToken = (() => {
  try {
    return localStorage.getItem('refreshtoken');
  } catch {
    return null;
  }
})();

const initialState: AuthState = {
  user: savedUser,
  token: savedToken,
  refreshToken: savedRefreshToken,
  loading: false,
  error: null,
  isAuthenticated: !!savedUser && !!savedToken
};


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string; refreshToken?: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('access token', action.payload.token);
      if (action.payload.refreshToken) {
        localStorage.setItem('refreshtoken', action.payload.refreshToken);
      }
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      localStorage.setItem('access token', action.payload);
    },
    updateTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string; expiresIn?: number }>) => {
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('access token', action.payload.accessToken);
      localStorage.setItem('refreshtoken', action.payload.refreshToken);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('user');
      localStorage.removeItem('access token');
      localStorage.removeItem('refreshtoken');
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

export const { setCredentials, updateAccessToken, updateTokens, logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;

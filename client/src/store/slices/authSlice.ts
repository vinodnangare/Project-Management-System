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
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
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
const savedAccessToken = (() => {
  try {
    return localStorage.getItem('accessToken');
  } catch {
    return null;
  }
})();
const savedRefreshToken = (() => {
  try {
    return localStorage.getItem('refreshToken');
  } catch {
    return null;
  }
})();
// Legacy token support for migration
const legacyToken = (() => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
})();

const initialState: AuthState = {
  user: savedUser,
  token: savedAccessToken || legacyToken,
  accessToken: savedAccessToken || legacyToken,
  refreshToken: savedRefreshToken,
  expiresIn: null,
  loading: false,
  error: null,
  isAuthenticated: !!savedUser && !!(savedAccessToken || legacyToken)
};


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ 
      user: User; 
      accessToken: string;
      refreshToken: string;
      expiresIn?: number;
      // Legacy support
      token?: string;
    }>) => {
      const { user, accessToken, refreshToken, expiresIn, token } = action.payload;
      const actualAccessToken = accessToken || token || '';
      
      state.user = user;
      state.token = actualAccessToken;
      state.accessToken = actualAccessToken;
      state.refreshToken = refreshToken || null;
      state.expiresIn = expiresIn || null;
      state.isAuthenticated = true;
      state.error = null;
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', actualAccessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      // Remove legacy token if exists
      localStorage.removeItem('token');
    },
    updateTokens: (state, action: PayloadAction<{
      accessToken: string;
      refreshToken: string;
      expiresIn?: number;
    }>) => {
      const { accessToken, refreshToken, expiresIn } = action.payload;
      state.token = accessToken;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.expiresIn = expiresIn || null;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.expiresIn = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('token'); // Remove legacy token
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

export const { setCredentials, updateTokens, logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;

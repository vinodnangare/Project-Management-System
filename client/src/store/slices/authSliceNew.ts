import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../services/api';

export interface AuthState {
  user: User | null;
  token: string | null;
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
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    }
  }
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;

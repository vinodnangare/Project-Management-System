import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Store dispatch reference for logout handling
let storeDispatch: any = null;

export const setStoreDispatchForBaseQuery = (dispatch: any) => {
  storeDispatch = dispatch;
};

/**
 * Base query with automatic token expiration handling
 * Detects 401 errors, clears auth state, shows toast, and redirects to login
 */
export const createBaseQueryWithErrorHandling = () => {
  return async (args: any, api: any, extraOptions: any) => {
    const baseQuery = fetchBaseQuery({
      baseUrl: API_BASE_URL,
      prepareHeaders: (headers: any, { getState }: any) => {
        const state = getState() as RootState;
        const token = state.auth.token || localStorage.getItem('token');
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
      },
    });

    const result = await baseQuery(args, api, extraOptions);

    // Handle 401 Unauthorized (token expired)
    if (result.error?.status === 401) {
      // Clear auth state from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Show error toast
      toast.error('Session expired. Please login again.', {
        duration: 3000,
        position: 'top-right',
      });

      // Dispatch logout action
      if (storeDispatch) {
        const { logout } = await import('../store/slices/authSlice');
        storeDispatch(logout());
      }

      // Redirect to login
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
    }

    return result;
  };
};

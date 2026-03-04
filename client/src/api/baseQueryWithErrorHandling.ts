import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { AppDispatch } from '../store';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Store dispatch reference for logout handling
let storeDispatch: AppDispatch | null = null;

// Flag to prevent multiple refresh attempts
let isRefreshing = false;

export const setStoreDispatchForBaseQuery = (dispatch: AppDispatch) => {
  storeDispatch = dispatch;
};

/**
 * Attempt to refresh the access token using the refresh token
 * Returns true if successful, false otherwise
 */
const attemptTokenRefresh = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem('refreshtoken');
  
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      // Update tokens in localStorage
      localStorage.setItem('access token', data.data.accessToken);
      if (data.data.refreshToken) {
        localStorage.setItem('refreshtoken', data.data.refreshToken);
      }
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
};

/**
 * Handle logout - clear tokens and redirect to login
 */
const handleLogout = async (showToast: boolean = true) => {
  // Clear auth state from localStorage
  localStorage.removeItem('access token');
  localStorage.removeItem('refreshtoken');
  localStorage.removeItem('user');

  if (showToast) {
    toast.error('Session expired. Please login again.', {
      duration: 3000,
      position: 'top-right',
    });
  }

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
};

/**
 * Base query with automatic token expiration handling and refresh token support
 * - Detects 401 errors
 * - Attempts to refresh access token using refresh token
 * - If refresh succeeds, retries the original request
 * - If refresh fails, logs out the user
 */
export const createBaseQueryWithErrorHandling = (): BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> => {
  const baseQuery = fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      // Always get token from localStorage
      const token = localStorage.getItem('access token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  });

  return async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    // Handle 401 Unauthorized (token expired or invalid)
    if (result.error?.status === 401) {
      // Prevent multiple simultaneous refresh attempts
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const refreshSuccess = await attemptTokenRefresh();
          
          if (refreshSuccess) {
            // Retry the original request with the new token
            result = await baseQuery(args, api, extraOptions);
          } else {
            // Refresh failed - logout the user
            await handleLogout();
          }
        } finally {
          isRefreshing = false;
        }
      } else {
        // Another refresh is in progress, wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        result = await baseQuery(args, api, extraOptions);
        
        // If still 401 after waiting for refresh, logout
        if (result.error?.status === 401) {
          await handleLogout();
        }
      }
    }

    return result;
  };
};

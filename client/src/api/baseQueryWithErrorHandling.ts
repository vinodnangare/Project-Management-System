import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Store dispatch reference for logout handling
let storeDispatch: any = null;
let storeGetState: (() => RootState) | null = null;

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

export const setStoreDispatchForBaseQuery = (dispatch: any, getState?: () => RootState) => {
  storeDispatch = dispatch;
  if (getState) {
    storeGetState = getState;
  }
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (): Promise<{ accessToken: string; refreshToken: string; expiresIn: number } | null> => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    return null;
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
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        expiresIn: data.data.expiresIn,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

/**
 * Handle logout - clear state and redirect
 */
const handleLogout = async (message: string = 'Session expired. Please login again.') => {
  // Clear auth state from localStorage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('token'); // Legacy cleanup

  // Show error toast
  toast.error(message, {
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
};

/**
 * Base query with automatic token expiration handling and refresh
 * Detects 401 errors, attempts token refresh, falls back to logout
 */
export const createBaseQueryWithErrorHandling = () => {
  return async (args: any, api: any, extraOptions: any) => {
    const baseQuery = fetchBaseQuery({
      baseUrl: API_BASE_URL,
      prepareHeaders: (headers: any, { getState }: any) => {
        const state = getState() as RootState;
        const token = state.auth.accessToken || state.auth.token || localStorage.getItem('accessToken') || localStorage.getItem('token');
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
      },
    });

    let result = await baseQuery(args, api, extraOptions);

    // Handle 401 Unauthorized (token expired)
    if (result.error?.status === 401) {
      const errorData = result.error.data as any;
      const errorCode = errorData?.code;
      
      // Check if token is expired (not invalidated or other auth errors)
      if (errorCode === 'TOKEN_EXPIRED' || errorData?.error === 'Token expired') {
        // Prevent multiple simultaneous refresh attempts
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = refreshAccessToken();
        }

        const newTokens = await refreshPromise;
        isRefreshing = false;
        refreshPromise = null;

        if (newTokens) {
          // Update tokens in localStorage
          localStorage.setItem('accessToken', newTokens.accessToken);
          localStorage.setItem('refreshToken', newTokens.refreshToken);

          // Update Redux state
          if (storeDispatch) {
            const { updateTokens } = await import('../store/slices/authSlice');
            storeDispatch(updateTokens(newTokens));
          }

          // Retry the original request with new token
          result = await baseQuery(args, api, extraOptions);
          
          // If still failing after refresh, logout
          if (result.error?.status === 401) {
            await handleLogout('Session expired. Please login again.');
          }
        } else {
          // Refresh failed, logout
          await handleLogout('Session expired. Please login again.');
        }
      } else if (errorCode === 'TOKEN_INVALIDATED') {
        // Token was explicitly invalidated (logout from another device, etc.)
        await handleLogout('Your session was invalidated. Please login again.');
      } else {
        // Other auth errors - just logout
        await handleLogout('Authentication failed. Please login again.');
      }
    }

    return result;
  };
};

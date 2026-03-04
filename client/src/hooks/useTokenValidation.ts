import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { logout, updateTokens } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


export const useTokenValidation = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, refreshToken: storeRefreshToken } = useAppSelector((state) => state.auth);
  const isRefreshing = useRef(false);

  /**
   * Attempt to refresh the access token using the refresh token
   */
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('refreshtoken') || storeRefreshToken;
    
    if (!refreshToken) {
      return false;
    }

    if (isRefreshing.current) {
      // Wait for ongoing refresh to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      return !!localStorage.getItem('access token');
    }

    isRefreshing.current = true;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        isRefreshing.current = false;
        return false;
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Update tokens in Redux and localStorage
        dispatch(updateTokens({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresIn: data.data.expiresIn,
        }));
        
        isRefreshing.current = false;
        return true;
      }
      
      isRefreshing.current = false;
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      isRefreshing.current = false;
      return false;
    }
  }, [dispatch, storeRefreshToken]);

  /**
   * Validate current token state and refresh if needed
   */
  const validateAndRefreshTokens = useCallback(async () => {
    if (!isAuthenticated) return;

    const accessToken = localStorage.getItem('access token');
    const refreshToken = localStorage.getItem('refreshtoken');
    const user = localStorage.getItem('user');

    // If access token is missing but refresh token exists, try to refresh
    if (!accessToken && refreshToken && user) {
      console.log('Access token missing, attempting refresh...');
      const refreshed = await refreshAccessToken();
      
      if (!refreshed) {
        console.log('Token refresh failed, logging out...');
        toast.error('Session expired. Please login again.', {
          duration: 3000,
          position: 'top-right',
        });
        dispatch(logout());
      } else {
        console.log('Token refreshed successfully');
      }
      return;
    }

    // If no tokens at all, logout
    if (!accessToken && !refreshToken) {
      if (isAuthenticated) {
        console.log('No tokens found, logging out...');
        dispatch(logout());
      }
      return;
    }

    // If no user data, logout
    if (!user) {
      console.log('User data missing, logging out...');
      dispatch(logout());
    }
  }, [isAuthenticated, refreshAccessToken, dispatch]);

  // Listen for storage events (tokens removed from another tab or manually)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Handle access token removal
      if (event.key === 'access token' && !event.newValue) {
        console.log('Access token removed from storage');
        validateAndRefreshTokens();
      }
      
      // Handle refresh token removal - force logout
      if (event.key === 'refreshtoken' && !event.newValue) {
        console.log('Refresh token removed from storage');
        if (isAuthenticated) {
          dispatch(logout());
        }
      }
      
      // Handle user data removal
      if (event.key === 'user' && !event.newValue) {
        console.log('User data removed from storage');
        if (isAuthenticated) {
          dispatch(logout());
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated, validateAndRefreshTokens, dispatch]);

  // Check token state on window focus
  useEffect(() => {
    const handleFocus = () => {
      validateAndRefreshTokens();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [validateAndRefreshTokens]);

  // Periodic check for token state
  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(() => {
      const accessToken = localStorage.getItem('access token');
      const refreshToken = localStorage.getItem('refreshtoken');
      
      
      if (!accessToken) {
        validateAndRefreshTokens();
      }
      
      
      if (!accessToken && !refreshToken) {
        dispatch(logout());
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, validateAndRefreshTokens, dispatch]);

  // Initial validation on mount
  useEffect(() => {
    validateAndRefreshTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    validateAndRefreshTokens,
    refreshAccessToken,
  };
};

export default useTokenValidation;

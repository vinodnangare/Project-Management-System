import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

/**
 * Typed Redux Hooks
 * Pre-typed versions of useDispatch and useSelector to maintain type safety
 * throughout the application when working with Redux
 */

/**
 * Custom hook that returns the Redux dispatch function with proper typing
 * Enables dispatching typed actions and thunks throughout the application
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Custom hook for selecting Redux state with automatic type inference
 * Replaces useSelector with pre-typed version that knows about RootState
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from './slices/tasksSlice';
import commentsReducer from './slices/commentsSlice';
import activitiesReducer from './slices/activitiesSlice';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';

/**
 * Redux Store Configuration
 * 
 * Why Redux (with Redux Toolkit):
 * - Structured state management at scale
 * - Redux Toolkit reduces boilerplate significantly
 * - Great for large applications with complex state
 * - Time-travel debugging capabilities
 * - Large ecosystem and community support
 * - Easy to add middleware for logging, error handling, etc.
 * 
 * Redux Toolkit features we're using:
 * - createSlice: Combines actions and reducers
 * - configureStore: Pre-configured store with middleware
 * - Immer: Immutable updates with mutable syntax
 * - Thunk: Built-in middleware for async operations
 */

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
    comments: commentsReducer,
    activities: activitiesReducer,
    ui: uiReducer,
    auth: authReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types in serialization check
        // since dates are used in our data
        ignoredActions: ['tasks/setTasks']
      }
    })
});

// Export types for use in hooks and components
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

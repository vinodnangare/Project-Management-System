import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import uiModalReducer from './slices/uiModalSlice';
import { api } from '../services/api';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    uiModal: uiModalReducer,
    [api.reducerPath]: api.reducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

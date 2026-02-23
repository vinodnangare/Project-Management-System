import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import uiModalReducer from './slices/uiModalSlice';
import { api } from '../services/api';
import { meetingsApi } from '../modules/meetings/api/meetingsApi';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    uiModal: uiModalReducer,
    [api.reducerPath]: api.reducer,
    [meetingsApi.reducerPath]: meetingsApi.reducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware()
    .concat(api.middleware)
    .concat(meetingsApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

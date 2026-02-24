import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { IMeeting, ICreateMeeting } from '../types/meetingTypes';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const meetingsApi = createApi({
  reducerPath: 'meetingsApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Meeting', 'User'],
  endpoints: (builder) => ({
    getMeetings: builder.query<{ success: boolean; data: IMeeting[]; meta?: any }, any>({
      query: (params) => ({
        url: '/meetings',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Meeting' as const, id })),
              { type: 'Meeting', id: 'LIST' }
            ]
          : [{ type: 'Meeting', id: 'LIST' }],
    }),
    getMeeting: builder.query<{ success: boolean; data: IMeeting }, string>({
      query: (id) => `/meetings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Meeting', id }],
    }),
    createMeeting: builder.mutation<{ success: boolean; data: IMeeting }, ICreateMeeting>({
      query: (data) => ({
        url: '/meetings',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Meeting', id: 'LIST' }],
    }),
    updateMeeting: builder.mutation<{ success: boolean; data: IMeeting }, { id: string; data: Partial<ICreateMeeting> }>({
      query: ({ id, data }) => ({
        url: `/meetings/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Meeting', id },
        { type: 'Meeting', id: 'LIST' }
      ],
    }),
    deleteMeeting: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/meetings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Meeting', id },
        { type: 'Meeting', id: 'LIST' }
      ],
    }),
    getUpcomingMeetings: builder.query<{ success: boolean; data: IMeeting[] }, number | void>({
      query: (limit = 5) => `/meetings/upcoming?limit=${limit}`,
      providesTags: ['Meeting'],
    }),
    getTodaysMeetings: builder.query<{ success: boolean; data: IMeeting[] }, void>({
      query: () => '/meetings/today',
      providesTags: ['Meeting'],
    }),
    getCalendarMeetings: builder.query<{ success: boolean; data: IMeeting[] }, { from: string; to: string }>({
      query: ({ from, to }) => `/meetings/calendar?from=${from}&to=${to}`,
      providesTags: ['Meeting'],
    }),
    getAssignableUsers: builder.query<{ success: boolean; data: Array<{ id: string; full_name: string; email: string }> }, void>({
      query: () => '/meetings/users/assignable',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useGetMeetingsQuery,
  useGetMeetingQuery,
  useCreateMeetingMutation,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
  useGetUpcomingMeetingsQuery,
  useGetTodaysMeetingsQuery,
  useGetCalendarMeetingsQuery,
  useGetAssignableUsersQuery,
} = meetingsApi;


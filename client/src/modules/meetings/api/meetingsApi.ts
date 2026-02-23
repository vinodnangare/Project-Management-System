import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { IMeeting, ICreateMeeting } from '../types/meetingTypes';

export const meetingsApi = createApi({
  reducerPath: 'meetingsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Meeting'],
  endpoints: (builder) => ({
    getMeetings: builder.query<IMeeting[], any>({
      query: (params) => ({
        url: '/meetings',
        params,
      }),
      providesTags: ['Meeting'],
    }),
    getMeeting: builder.query<IMeeting, string>({
      query: (id) => `/meetings/${id}`,
      providesTags: ['Meeting'],
    }),
    createMeeting: builder.mutation<IMeeting, ICreateMeeting>({
      query: (data) => ({
        url: '/meetings',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Meeting'],
    }),
    updateMeeting: builder.mutation<IMeeting, { id: string; data: Partial<ICreateMeeting> }>({
      query: ({ id, data }) => ({
        url: `/meetings/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Meeting'],
    }),
    deleteMeeting: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/meetings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Meeting'],
    }),
  }),
});

export const {
  useGetMeetingsQuery,
  useGetMeetingQuery,
  useCreateMeetingMutation,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
} = meetingsApi;

import { z } from 'zod';
import { MeetingType, MeetingStatus } from '../types/meeting.js';

const MeetingTypeEnum = z.enum([
  MeetingType.ONLINE,
  MeetingType.OFFLINE
]);

const MeetingStatusEnum = z.enum([
  MeetingStatus.SCHEDULED,
  MeetingStatus.COMPLETED,
  MeetingStatus.CANCELLED,
  MeetingStatus.RESCHEDULED
]);

export const createMeetingSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .nullable()
    .optional(),
  assignedTo: z
    .array(z.string())
    .min(1, 'At least one assigned user is required'),
  client: z
    .string()
    .nullable()
    .optional(),
  lead: z
    .string()
    .nullable()
    .optional(),
  startTime: z
    .string()
    .min(1, 'Start time is required')
    .transform((val) => new Date(val)),
  endTime: z
    .string()
    .min(1, 'End time is required')
    .transform((val) => new Date(val)),
  meetingType: MeetingTypeEnum.default(MeetingType.OFFLINE),
  location: z
    .string()
    .max(500, 'Location must be less than 500 characters')
    .nullable()
    .optional(),
  meetingLink: z
    .string()
    .max(500, 'Meeting link must be less than 500 characters')
    .nullable()
    .optional(),
  status: MeetingStatusEnum.default(MeetingStatus.SCHEDULED),
  notes: z
    .string()
    .max(5000, 'Notes must be less than 5000 characters')
    .nullable()
    .optional()
}).refine((data) => {
  // Validate that startTime is before endTime
  return data.startTime < data.endTime;
}, {
  message: 'Start time must be before end time',
  path: ['startTime']
}).refine((data) => {
  // If meetingType is online, meetingLink should be provided
  if (data.meetingType === MeetingType.ONLINE && !data.meetingLink) {
    return false;
  }
  return true;
}, {
  message: 'Meeting link is required for online meetings',
  path: ['meetingLink']
}).refine((data) => {
  // If meetingType is offline, location should be provided
  if (data.meetingType === MeetingType.OFFLINE && !data.location) {
    return false;
  }
  return true;
}, {
  message: 'Location is required for offline meetings',
  path: ['location']
});

export const updateMeetingSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .nullable()
    .optional(),
  assignedTo: z
    .array(z.string())
    .min(1, 'At least one assigned user is required')
    .optional(),
  client: z
    .string()
    .nullable()
    .optional(),
  lead: z
    .string()
    .nullable()
    .optional(),
  startTime: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  endTime: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  meetingType: MeetingTypeEnum.optional(),
  location: z
    .string()
    .max(500, 'Location must be less than 500 characters')
    .nullable()
    .optional(),
  meetingLink: z
    .string()
    .max(500, 'Meeting link must be less than 500 characters')
    .nullable()
    .optional(),
  status: MeetingStatusEnum.optional(),
  notes: z
    .string()
    .max(5000, 'Notes must be less than 5000 characters')
    .nullable()
    .optional()
});

export const updateMeetingStatusSchema = z.object({
  status: MeetingStatusEnum
});

export type CreateMeetingRequest = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingRequest = z.infer<typeof updateMeetingSchema>;
export type UpdateMeetingStatusRequest = z.infer<typeof updateMeetingStatusSchema>;

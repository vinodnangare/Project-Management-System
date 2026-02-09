import { z } from 'zod';
import { TaskStatus, TaskPriority } from '../types/index.js';

const StatusEnum = z.enum([
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.DONE
]);

const PriorityEnum = z.enum([
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH
]);

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .nullable()
    .optional(),
  priority: PriorityEnum.default(TaskPriority.MEDIUM),
  assigned_to: z.string().nullable().optional(),
  assignees: z.array(z.string()).optional(),
  due_date: z
    .string()
    .datetime()
    .nullable(),
  estimated_hours: z
    .number()
    .positive('Estimated hours must be positive')
    .max(1000, 'Estimated hours must be less than 1000')
    .nullable()
    .optional(),
  created_by: z.string().min(1, 'Created by is required')
});

export const updateTaskSchema = z.object({
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
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  assigned_to: z.string().nullable().optional(),
  due_date: z
    .string()
    .datetime()
    .nullable()
    .optional()
});

export const addCommentSchema = z.object({
  comment: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters'),
  created_by: z.string().min(1, 'Created by is required')
});

export type CreateTaskRequest = z.infer<typeof createTaskSchema>;
export type UpdateTaskRequest = z.infer<typeof updateTaskSchema>;
export type AddCommentRequest = z.infer<typeof addCommentSchema>;

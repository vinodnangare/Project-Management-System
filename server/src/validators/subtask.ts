import { z } from 'zod';

export const createSubtaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Subtask title is required')
    .max(255, 'Subtask title must be less than 255 characters'),
  description: z
    .string()
    .max(2000, 'Subtask description must be less than 2000 characters')
    .nullable()
    .optional(),
  created_by: z.string().min(1, 'Created by is required')
});

export const updateSubtaskStatusSchema = z.object({
  status: z.enum(['TODO', 'DONE'], {
    errorMap: () => ({ message: 'Status must be either TODO or DONE' })
  })
});

export type CreateSubtaskRequest = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskStatusRequest = z.infer<typeof updateSubtaskStatusSchema>;

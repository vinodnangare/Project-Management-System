import { z } from 'zod';
import { LeadStage, LeadSource, LeadPriority } from '../types/index.js';

const StageEnum = z.enum([
  LeadStage.NEW,
  LeadStage.IN_DISCUSSION,
  LeadStage.QUOTED,
  LeadStage.WON,
  LeadStage.LOST
]);

const SourceEnum = z.enum([
  LeadSource.WEB,
  LeadSource.REFERRAL,
  LeadSource.CAMPAIGN,
  LeadSource.MANUAL
]);

const PriorityEnum = z.enum([
  LeadPriority.HIGH,
  LeadPriority.MEDIUM,
  LeadPriority.LOW
]);

export const createLeadSchema = z.object({
  company_name: z
    .string()
    .min(1, 'Company name is required')
    .max(255, 'Company name must be less than 255 characters'),
  contact_name: z
    .string()
    .min(1, 'Contact name is required')
    .max(255, 'Contact name must be less than 255 characters'),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  phone: z
    .string()
    .max(20, 'Phone must be less than 20 characters')
    .nullable()
    .optional(),
  stage: StageEnum.default(LeadStage.NEW),
  priority: PriorityEnum.default(LeadPriority.MEDIUM),
  source: SourceEnum.default(LeadSource.MANUAL),
  owner_id: z.string().nullable().optional()
});

export const updateLeadSchema = z.object({
  company_name: z
    .string()
    .min(1, 'Company name is required')
    .max(255, 'Company name must be less than 255 characters')
    .optional(),
  contact_name: z
    .string()
    .min(1, 'Contact name is required')
    .max(255, 'Contact name must be less than 255 characters')
    .optional(),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional(),
  phone: z
    .string()
    .max(20, 'Phone must be less than 20 characters')
    .nullable()
    .optional(),
  stage: StageEnum.optional(),
  priority: PriorityEnum.optional(),
  source: SourceEnum.optional(),
  owner_id: z.string().nullable().optional()
});

export const updateLeadStageSchema = z.object({
  stage: StageEnum
});

export type CreateLeadRequest = z.infer<typeof createLeadSchema>;
export type UpdateLeadRequest = z.infer<typeof updateLeadSchema>;
export type UpdateLeadStageRequest = z.infer<typeof updateLeadStageSchema>;
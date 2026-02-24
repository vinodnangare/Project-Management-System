export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum ActivityAction {
  CREATED = 'CREATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  PRIORITY_CHANGED = 'PRIORITY_CHANGED',
  ASSIGNED = 'ASSIGNED',
  UNASSIGNED = 'UNASSIGNED',
  COMMENTED = 'COMMENTED',
  TITLE_CHANGED = 'TITLE_CHANGED',
  DESCRIPTION_CHANGED = 'DESCRIPTION_CHANGED',
  DUE_DATE_CHANGED = 'DUE_DATE_CHANGED',
  DELETED = 'DELETED',
  SUBTASK_UPDATED = 'SUBTASK_UPDATED'
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  assigned_to_name?: string | null;
  assigned_to_email?: string | null;
  created_by: string;
  created_by_name?: string | null;
  created_by_email?: string | null;
  due_date: string | null;
  estimated_hours?: number | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  comment: string;
  created_by: string;
  created_by_name?: string | null;
  created_by_email?: string | null;
  created_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'DONE';
  created_by: string;
  created_by_name?: string | null;
  created_by_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  action: ActivityAction;
  old_value: string | null;
  new_value: string | null;
  performed_by: string;
  performed_by_name?: string | null;
  performed_by_email?: string | null;
  created_at: string;
}

export interface TaskDoc {
  id: string;
  task_id: string;
  content: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export enum LeadStage {
  NEW = 'new',
  IN_DISCUSSION = 'in_discussion',
  QUOTED = 'quoted',
  WON = 'won',
  LOST = 'lost'
}

export enum LeadSource {
  WEB = 'web',
  REFERRAL = 'referral',
  CAMPAIGN = 'campaign',
  MANUAL = 'manual'
}

export enum LeadPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  stage: LeadStage;
  priority: LeadPriority;
  source: LeadSource;
  notes: string | null;
  owner_id: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  created_by: string;
  created_by_name?: string | null;
  created_by_email?: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// Meeting types
export { MeetingType, MeetingStatus } from './meeting.js';
export type { Meeting as MeetingInterface } from './meeting.js';

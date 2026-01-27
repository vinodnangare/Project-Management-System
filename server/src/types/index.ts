// Task Status enumeration - represents different states a task can be in
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE'
}

// Task Priority enumeration - defines the importance level of a task
export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

// Task Activity Action types - tracks what changes happened to a task
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
  DELETED = 'DELETED'
}

/**
 * Task Model Interface
 * Represents a task entity in the system
 * 
 * Why these fields:
 * - id: Unique identifier for the task
 * - title: What the task is about (required - essential information)
 * - description: Detailed context and requirements
 * - status: Current state to track progress
 * - priority: Helps prioritize work in backlog
 * - assigned_to: User responsible for completion
 * - created_by: Audit trail - who created it
 * - due_date: Time management and deadline tracking
 * - is_deleted: Soft delete for data recovery
 * - created_at, updated_at: Timestamps for audit and sorting
 */
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

/**
 * TaskComment Model Interface
 * Represents a comment/discussion on a task
 * 
 * Why this structure:
 * - Maintains conversation thread for collaboration
 * - created_by tracks who commented (accountability)
 * - created_at for chronological ordering
 */
export interface TaskComment {
  id: string;
  task_id: string;
  comment: string;
  created_by: string;
  created_by_name?: string | null;
  created_by_email?: string | null;
  created_at: string;
}

/**
 * TaskActivity Model Interface
 * Audit log - tracks all changes made to a task
 * 
 * Why this is important:
 * - Shows what changed (action)
 * - Shows before/after values (old_value, new_value)
 * - Shows who made the change and when (accountability)
 * - Enables activity timeline UI feature
 * - Critical for audit and compliance
 */
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

/**
 * Pagination Metadata Interface
 * Helps frontend handle large datasets efficiently
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * API Response Wrapper
 * Provides consistent response structure across all endpoints
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

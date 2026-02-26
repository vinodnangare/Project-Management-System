export enum MeetingType {
  ONLINE = 'online',
  OFFLINE = 'offline'
}

export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled'
}

export enum MeetingRecurrence {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export enum MeetingActivityAction {
  CREATED = 'CREATED',
  TITLE_CHANGED = 'TITLE_CHANGED',
  DESCRIPTION_CHANGED = 'DESCRIPTION_CHANGED',
  TIME_CHANGED = 'TIME_CHANGED',
  TYPE_CHANGED = 'TYPE_CHANGED',
  LOCATION_CHANGED = 'LOCATION_CHANGED',
  LINK_CHANGED = 'LINK_CHANGED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  ASSIGNEES_CHANGED = 'ASSIGNEES_CHANGED',
  NOTES_UPDATED = 'NOTES_UPDATED',
  PERSONAL_NOTE_UPDATED = 'PERSONAL_NOTE_UPDATED',
  RECURRENCE_CHANGED = 'RECURRENCE_CHANGED',
  DELETED = 'DELETED'
}

export interface MeetingAssignee {
  id: string;
  full_name: string;
  email: string;
}

export interface UserNote {
  userId: string;
  userName?: string;
  content: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  assignedTo: string[];
  assignees: MeetingAssignee[];
  createdBy: string;
  createdBy_name?: string | null;
  createdBy_email?: string | null;
  client: string | null;
  client_name?: string | null;
  lead: string | null;
  lead_company_name?: string | null;
  startTime: string;
  endTime: string;
  meetingType: MeetingType;
  location: string | null;
  meetingLink: string | null;
  status: MeetingStatus;
  recurrence: MeetingRecurrence;
  recurringTemplateId?: string | null;
  notes: string | null;
  userNotes: UserNote[];
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface MeetingActivity {
  id: string;
  meeting_id: string;
  action: MeetingActivityAction;
  old_value: string | null;
  new_value: string | null;
  performed_by: string;
  performed_by_name?: string | null;
  performed_by_email?: string | null;
  created_at: string;
}

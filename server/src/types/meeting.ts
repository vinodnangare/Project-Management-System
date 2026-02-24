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

export interface MeetingAssignee {
  id: string;
  full_name: string;
  email: string;
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
  notes: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

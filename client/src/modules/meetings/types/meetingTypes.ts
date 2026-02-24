export interface IMeetingAssignee {
  id: string;
  full_name: string;
  email: string;
}

export interface IMeeting {
  id: string;
  title: string;
  description?: string;
  assignedTo: string[];
  assignees?: IMeetingAssignee[];
  createdBy?: string;
  createdBy_name?: string;
  createdBy_email?: string;
  client?: string;
  client_name?: string;
  lead?: string;
  lead_company_name?: string;
  startTime: string;
  endTime: string;
  meetingType: 'online' | 'offline';
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ICreateMeeting {
  title: string;
  description?: string;
  assignedTo: string[];
  client?: string;
  lead?: string;
  startTime: string;
  endTime: string;
  meetingType: 'online' | 'offline';
  location?: string;
  meetingLink?: string;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
}

// For backwards compatibility with MeetingList component
export type Meeting = IMeeting;


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
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly';
  notesFileName?: string;
  notesFilePath?: string;
}

export interface ICreateMeeting {
  title: string;
  description?: string | null;
  assignedTo: string[];
  client?: string | null;
  lead?: string | null;
  startTime: string;
  endTime: string;
  meetingType: 'online' | 'offline';
  location?: string | null;
  meetingLink?: string | null;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string | null;
  /** Recurrence for the meeting: once, daily, weekly or monthly */
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly';
  /** Optional uploaded meeting notes file (base64) and original filename */
  notesFileName?: string | null;
  notesFileBase64?: string | null;
  /** Flag to force full notes replacement (for edit/delete operations) */
  replaceNotes?: boolean;
}

// For backwards compatibility with MeetingList component
export type Meeting = IMeeting;


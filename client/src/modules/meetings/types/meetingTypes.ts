export interface IMeeting {
  _id: string;
  title: string;
  description?: string;
  assignedTo: string;
  client?: string;
  lead?: string;
  startTime: string;
  endTime: string;
  meetingType: 'online' | 'offline';
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface ICreateMeeting extends Omit<IMeeting, '_id' | 'status'> {
  status?: 'scheduled' | 'completed' | 'cancelled';
}

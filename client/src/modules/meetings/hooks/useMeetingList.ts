import { useState } from 'react';
import type { Meeting } from '../types/meetingTypes';

export function useMeetingList(initialMeetings: Meeting[] = []) {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const selectMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
  };

  return {
    meetings,
    setMeetings,
    selectedMeeting,
    selectMeeting,
  };
}

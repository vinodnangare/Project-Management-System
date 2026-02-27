import React from 'react';
import type { Meeting } from '../types/meetingTypes';

export interface MeetingListProps {
  meetings: Meeting[];
  onSelect: (meeting: Meeting) => void;
}

export const MeetingList: React.FC<MeetingListProps> = ({ meetings, onSelect }) => {
  return (
    <ul className="meeting-list">
      {meetings.map(meeting => (
        <li key={meeting.id} onClick={() => onSelect(meeting)}>
          <strong>{meeting.title}</strong> — {meeting.startTime} to {meeting.endTime}
        </li>
      ))}
    </ul>
  );
};

import React from 'react';

export interface MeetingNotesProps {
  notes: string;
}

const MeetingNotes: React.FC<MeetingNotesProps> = ({ notes }) => (
  <div className="meeting-notes">
    <h3>Notes</h3>
    <div>{notes || 'No notes available.'}</div>
  </div>
);

export default MeetingNotes;

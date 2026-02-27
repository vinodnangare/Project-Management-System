import React, { useState } from 'react';
import type { Meeting } from '../types/meetingTypes';

export interface MeetingQuickAddProps {
  onAdd: (meeting: Partial<Meeting>) => void;
}

export const MeetingQuickAdd: React.FC<MeetingQuickAddProps> = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleAdd = () => {
    if (title && startTime && endTime) {
      onAdd({ title, startTime, endTime });
      setTitle('');
      setStartTime('');
      setEndTime('');
    }
  };

  return (
    <div className="meeting-quick-add">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <input
        type="datetime-local"
        value={startTime}
        onChange={e => setStartTime(e.target.value)}
      />
      <input
        type="datetime-local"
        value={endTime}
        onChange={e => setEndTime(e.target.value)}
      />
      <button onClick={handleAdd}>Quick Add</button>
    </div>
  );
};

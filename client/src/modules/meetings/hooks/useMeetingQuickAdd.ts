import { useState } from 'react';
import { Meeting } from '../types/meetingTypes';

export function useMeetingQuickAdd(onAdd: (meeting: Partial<Meeting>) => void) {
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

  return {
    title,
    setTitle,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    handleAdd,
  };
}

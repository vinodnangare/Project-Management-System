import { useState } from 'react';
import type { ICreateMeeting } from '../types/meetingTypes';

export function useMeetingForm(initial: Partial<ICreateMeeting> = {}) {
  const [form, setForm] = useState<ICreateMeeting>({
    title: '',
    assignedTo: '',
    startTime: '',
    endTime: '',
    meetingType: 'online',
    ...initial,
  });

  function updateField<K extends keyof ICreateMeeting>(key: K, value: ICreateMeeting[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return { form, setForm, updateField };
}

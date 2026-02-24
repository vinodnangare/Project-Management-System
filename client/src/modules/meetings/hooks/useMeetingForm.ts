import { useState } from 'react';
import type { ICreateMeeting } from '../types/meetingTypes';

const defaultForm: ICreateMeeting = {
  title: '',
  assignedTo: [],
  startTime: '',
  endTime: '',
  meetingType: 'offline',
  recurrence: 'once',
  notesFileName: undefined,
  notesFileBase64: undefined,
};

export function useMeetingForm(initial: Partial<ICreateMeeting> = {}) {
  const [form, setForm] = useState<ICreateMeeting>({
    ...defaultForm,
    ...initial,
  });

  function updateField<K extends keyof ICreateMeeting>(key: K, value: ICreateMeeting[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm({ ...defaultForm, ...initial });
  }

  return { form, setForm, updateField, resetForm };
}


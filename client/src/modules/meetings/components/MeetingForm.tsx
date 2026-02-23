import React from 'react';
import { useMeetingForm } from '../hooks/useMeetingForm';
import { useCreateMeetingMutation } from '../api/meetingsApi';

export const MeetingForm: React.FC = () => {
  const { form, updateField } = useMeetingForm();
  const [createMeeting, { isLoading }] = useCreateMeetingMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMeeting(form);
    // handle success/error
  };

  return (
    <form className="meeting-form" onSubmit={handleSubmit}>
      <label>Title
        <input value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="Title" required />
      </label>
      <label>Assigned To
        <input value={form.assignedTo} onChange={e => updateField('assignedTo', e.target.value)} placeholder="Assigned To" required />
      </label>
      <label>Start Time
        <input type="datetime-local" value={form.startTime} onChange={e => updateField('startTime', e.target.value)} required />
      </label>
      <label>End Time
        <input type="datetime-local" value={form.endTime} onChange={e => updateField('endTime', e.target.value)} required />
      </label>
      <label>Meeting Type
        <select value={form.meetingType} onChange={e => updateField('meetingType', e.target.value as 'online' | 'offline')}>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
      </label>
      {form.meetingType === 'online' && (
        <label>Meeting Link
          <input value={form.meetingLink || ''} onChange={e => updateField('meetingLink', e.target.value)} placeholder="Meeting Link" />
        </label>
      )}
      {form.meetingType === 'offline' && (
        <label>Location
          <input value={form.location || ''} onChange={e => updateField('location', e.target.value)} placeholder="Location" />
        </label>
      )}
      <label>Notes
        <textarea value={form.notes || ''} onChange={e => updateField('notes', e.target.value)} placeholder="Notes" />
      </label>
      <button type="submit" disabled={isLoading}>Save</button>
    </form>
  );
};

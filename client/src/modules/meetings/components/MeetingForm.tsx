import React, { useEffect } from 'react';
import { useMeetingForm } from '../hooks/useMeetingForm';
import { useCreateMeetingMutation, useUpdateMeetingMutation, useGetMeetingQuery, useGetAssignableUsersQuery } from '../api/meetingsApi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../../../styles/MeetingsList.css';

interface MeetingFormProps {
  meetingId?: string;
}

export const MeetingForm: React.FC<MeetingFormProps> = ({ meetingId }) => {
  const isEditMode = Boolean(meetingId);
  const { form, setForm, updateField, resetForm } = useMeetingForm();
  const [createMeeting, { isLoading: isCreating }] = useCreateMeetingMutation();
  const [updateMeeting, { isLoading: isUpdating }] = useUpdateMeetingMutation();
  const { data: meetingResponse, isLoading: meetingLoading } = useGetMeetingQuery(meetingId!, { skip: !meetingId });
  const { data: usersResponse, isLoading: usersLoading } = useGetAssignableUsersQuery();
  const navigate = useNavigate();

  const users = usersResponse?.data || [];
  const isLoading = isCreating || isUpdating;

  // Populate form with existing meeting data when editing
  useEffect(() => {
    if (isEditMode && meetingResponse?.data) {
      const meeting = meetingResponse.data;
      const formatDateForInput = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toISOString().slice(0, 16);
      };
      // Extract assignee IDs - could be from assignees array (populated) or assignedTo (string IDs)
      const assigneeIds = meeting.assignees?.map(a => a.id) || meeting.assignedTo || [];
      setForm({
        title: meeting.title,
        assignedTo: assigneeIds,
        startTime: formatDateForInput(meeting.startTime),
        endTime: formatDateForInput(meeting.endTime),
        meetingType: meeting.meetingType,
        meetingLink: meeting.meetingLink || '',
        location: meeting.location || '',
        notes: meeting.notes || '',
        client: meeting.client || undefined,
        lead: meeting.lead || undefined,
      });
    }
  }, [isEditMode, meetingResponse, setForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.assignedTo.length === 0) {
      toast.error('Please select at least one participant');
      return;
    }

    try {
      if (isEditMode && meetingId) {
        const result = await updateMeeting({ id: meetingId, data: form }).unwrap();
        if (result.success) {
          toast.success('Meeting updated successfully!');
          navigate('/meetings');
        }
      } else {
        const result = await createMeeting(form).unwrap();
        if (result.success) {
          toast.success('Meeting created successfully!');
          resetForm();
          navigate('/meetings');
        }
      }
    } catch (error: unknown) {
      const err = error as { data?: { error?: string; details?: Array<{ message: string }> } };
      const errorMessage = err?.data?.error || err?.data?.details?.[0]?.message || `Failed to ${isEditMode ? 'update' : 'create'} meeting`;
      toast.error(errorMessage);
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} meeting:`, error);
    }
  };

  if (isEditMode && meetingLoading) {
    return (
      <div className="meeting-form-loading">
        <div className="loading-spinner">Loading meeting data...</div>
      </div>
    );
  }

  const handleAssigneeChange = (userId: string) => {
    const currentAssignees = form.assignedTo;
    if (currentAssignees.includes(userId)) {
      updateField('assignedTo', currentAssignees.filter(id => id !== userId));
    } else {
      updateField('assignedTo', [...currentAssignees, userId]);
    }
  };

  return (
    <form className="meeting-form-modern" onSubmit={handleSubmit}>
      {/* Basic Info Section */}
      <div className="form-section">
        <h3 className="section-title">Basic Information</h3>
        
        <div className="form-group">
          <label htmlFor="title">Meeting Title *</label>
          <input 
            id="title"
            type="text"
            value={form.title} 
            onChange={e => updateField('title', e.target.value)} 
            placeholder="Enter meeting title"
            required 
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="meetingType">Meeting Type *</label>
            <select 
              id="meetingType"
              value={form.meetingType} 
              onChange={e => updateField('meetingType', e.target.value as 'online' | 'offline')}
            >
              <option value="online">🌐 Online Meeting</option>
              <option value="offline">📍 In-Person Meeting</option>
            </select>
          </div>

          {form.meetingType === 'online' && (
            <div className="form-group">
              <label htmlFor="meetingLink">Meeting Link *</label>
              <input 
                id="meetingLink"
                type="url"
                value={form.meetingLink || ''} 
                onChange={e => updateField('meetingLink', e.target.value)} 
                placeholder="https://meet.google.com/..." 
                required 
              />
            </div>
          )}

          {form.meetingType === 'offline' && (
            <div className="form-group">
              <label htmlFor="location">Location *</label>
              <input 
                id="location"
                type="text"
                value={form.location || ''} 
                onChange={e => updateField('location', e.target.value)} 
                placeholder="Conference Room, Office Address..." 
                required 
              />
            </div>
          )}
        </div>
      </div>

      {/* Schedule Section */}
      <div className="form-section">
        <h3 className="section-title">Schedule</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startTime">Start Date & Time *</label>
            <input 
              id="startTime"
              type="datetime-local" 
              value={form.startTime} 
              onChange={e => updateField('startTime', e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="endTime">End Date & Time *</label>
            <input 
              id="endTime"
              type="datetime-local" 
              value={form.endTime} 
              onChange={e => updateField('endTime', e.target.value)} 
              required 
            />
          </div>
        </div>
      </div>

      {/* Participants Section */}
      <div className="form-section">
        <h3 className="section-title">Participants</h3>
        
        <div className="form-group">
          <label>Select Participants * <span className="hint">(at least one required)</span></label>
          {usersLoading ? (
            <div className="loading-users">Loading users...</div>
          ) : (
            <div className="participants-selector">
              {users.map(user => (
                <label 
                  key={user.id} 
                  className={`participant-option ${form.assignedTo.includes(user.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={form.assignedTo.includes(user.id)}
                    onChange={() => handleAssigneeChange(user.id)}
                  />
                  <div className="participant-info">
                    <span className="participant-name">{user.full_name}</span>
                    <span className="participant-email">{user.email}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
          {form.assignedTo.length > 0 && (
            <div className="selected-count">
              {form.assignedTo.length} participant{form.assignedTo.length > 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="form-section">
        <h3 className="section-title">Additional Notes</h3>
        
        <div className="form-group">
          <label htmlFor="notes">Meeting Notes <span className="hint">(optional)</span></label>
          <textarea 
            id="notes"
            value={form.notes || ''} 
            onChange={e => updateField('notes', e.target.value)} 
            placeholder="Add agenda, instructions, or any additional information..."
            rows={4}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="form-actions-modern">
        <button 
          type="button" 
          className="btn-secondary" 
          onClick={() => navigate('/meetings')}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn-primary" 
          disabled={isLoading || usersLoading}
        >
          {isLoading ? 'Saving...' : isEditMode ? 'Update Meeting' : 'Create Meeting'}
        </button>
      </div>
    </form>
  );
};


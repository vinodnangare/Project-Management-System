import React from 'react';
import { useParams } from 'react-router-dom';
import { useGetMeetingQuery } from '../api/meetingsApi';
import MeetingNotes from '../components/MeetingNotes';

const MeetingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: meeting, isLoading } = useGetMeetingQuery(id || '');
  // TODO: Replace with real role check from store/context
  const isAdmin = true;

  if (isLoading) return <div>Loading...</div>;
  if (!meeting) return <div>Meeting not found.</div>;

  return (
    <div className="meeting-detail-page">
      <h2>{meeting.title}</h2>
      <div>Start: {meeting.startTime}</div>
      <div>End: {meeting.endTime}</div>
      <div>Status: {meeting.status}</div>
      <MeetingNotes notes={meeting.notes || ''} />
      {isAdmin && (
        <div className="meeting-detail-actions">
          <button className="btn-edit-meeting" onClick={() => window.location.href = `/meetings/${meeting._id}/edit`}>Edit</button>
          <button className="btn-delete-meeting">Delete</button>
        </div>
      )}
    </div>
  );
};

export default MeetingDetailPage;

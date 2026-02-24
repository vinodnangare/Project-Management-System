import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetMeetingQuery, useDeleteMeetingMutation } from '../api/meetingsApi';
import { useAppSelector } from '../../../hooks/redux';
import toast from 'react-hot-toast';
import '../../../styles/MeetingsList.css';

const MeetingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: response, isLoading, error } = useGetMeetingQuery(id || '', { skip: !id });
  const [deleteMeeting] = useDeleteMeetingMutation();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';

  const meeting = response?.data;

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: string; bg: string; label: string }> = {
      scheduled: { color: '#2563eb', bg: '#dbeafe', label: 'Scheduled' },
      completed: { color: '#16a34a', bg: '#dcfce7', label: 'Completed' },
      cancelled: { color: '#dc2626', bg: '#fee2e2', label: 'Cancelled' },
      rescheduled: { color: '#f59e0b', bg: '#fef3c7', label: 'Rescheduled' },
    };
    return statusMap[status] || { color: '#6b7280', bg: '#f3f4f6', label: status };
  };

  const handleDelete = async () => {
    if (!meeting) return;
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        await deleteMeeting(meeting.id).unwrap();
        toast.success('Meeting deleted successfully');
        navigate('/meetings');
      } catch (err) {
        toast.error('Failed to delete meeting');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="meeting-detail-page">
        <div className="loading-spinner">Loading meeting details...</div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="meeting-detail-page">
        <Link to="/meetings" className="back-link">← Back to Meetings</Link>
        <div className="error-message">
          <h3>Meeting not found</h3>
          <p>The meeting you're looking for doesn't exist or has been deleted.</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(meeting.status);

  return (
    <div className="meeting-detail-page">
      <Link to="/meetings" className="back-link">← Back to Meetings</Link>
      
      {/* Meeting Header */}
      <div className="meeting-detail-header">
        <div className="meeting-detail-title-section">
          <h2>{meeting.title}</h2>
          <span 
            className="meeting-status-badge"
            style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
          >
            {statusInfo.label}
          </span>
        </div>
        <div className="meeting-type-badge">
          {meeting.meetingType === 'online' ? '🌐 Online Meeting' : '📍 In-Person Meeting'}
        </div>
      </div>

      {/* Join Meeting Card - Prominent for online meetings */}
      {meeting.meetingType === 'online' && meeting.meetingLink && (
        <div className="join-meeting-card">
          <div className="join-meeting-content">
            <div className="join-meeting-icon">🎥</div>
            <div className="join-meeting-info">
              <h3>Join Meeting</h3>
              <p>Click the button below to join this online meeting</p>
            </div>
          </div>
          <a 
            href={meeting.meetingLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-join-meeting"
          >
            Join Now
          </a>
        </div>
      )}

      {/* Location Card - For offline meetings */}
      {meeting.meetingType === 'offline' && meeting.location && (
        <div className="location-card">
          <div className="location-icon">📍</div>
          <div className="location-info">
            <h3>Meeting Location</h3>
            <p>{meeting.location}</p>
          </div>
        </div>
      )}

      {/* Meeting Details */}
      <div className="meeting-detail-card">
        <h3>Meeting Details</h3>
        
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-icon">📅</span>
            <div className="detail-content">
              <label>Start Time</label>
              <span>{formatDateTime(meeting.startTime)}</span>
            </div>
          </div>
          
          <div className="detail-item">
            <span className="detail-icon">⏰</span>
            <div className="detail-content">
              <label>End Time</label>
              <span>{formatDateTime(meeting.endTime)}</span>
            </div>
          </div>

          {meeting.assignees && meeting.assignees.length > 0 && (
            <div className="detail-item full-width">
              <span className="detail-icon">👥</span>
              <div className="detail-content">
                <label>Participants</label>
                <div className="participants-list">
                  {meeting.assignees.map(a => (
                    <span key={a.id} className="participant-chip" title={a.email}>
                      {a.full_name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {meeting.createdBy_name && (
            <div className="detail-item">
              <span className="detail-icon">✍️</span>
              <div className="detail-content">
                <label>Organized By</label>
                <span>{meeting.createdBy_name}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      {meeting.notes && (
        <div className="meeting-notes-card">
          <h3>📝 Meeting Notes</h3>
          <div className="notes-content">
            {meeting.notes}
          </div>
        </div>
      )}

      {/* Meeting Link Info (for reference) */}
      {meeting.meetingType === 'online' && meeting.meetingLink && (
        <div className="meeting-link-info">
          <label>Meeting Link:</label>
          <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
            {meeting.meetingLink}
          </a>
        </div>
      )}

      {/* Admin Actions */}
      {isAdmin && (
        <div className="meeting-detail-actions">
          <button className="btn-secondary" onClick={() => navigate('/meetings')}>
            Back to List
          </button>
          <button className="btn-primary" onClick={() => navigate(`/meetings/${meeting.id}/edit`)}>
            Edit Meeting
          </button>
          <button className="btn-danger" onClick={handleDelete}>
            Delete Meeting
          </button>
        </div>
      )}

      {/* Employee Back Button */}
      {!isAdmin && (
        <div className="meeting-detail-actions">
          <button className="btn-secondary" onClick={() => navigate('/meetings')}>
            Back to Meetings
          </button>
        </div>
      )}
    </div>
  );
};

export default MeetingDetailPage;

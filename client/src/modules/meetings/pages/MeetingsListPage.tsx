import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetMeetingsQuery, useDeleteMeetingMutation, useUpdateMeetingMutation } from '../api/meetingsApi';
import { useAppSelector } from '../../../hooks/redux';
import toast from 'react-hot-toast';
import { HiOutlineGlobeAlt, HiOutlineLocationMarker, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import type { IMeeting } from '../types/meetingTypes';
import '../../../styles/MeetingsList.css';

const MeetingsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  
  const { data: response, isLoading, error, refetch } = useGetMeetingsQuery({
    status: filters.status || undefined,
    search: filters.search || undefined,
  });
  
  const [deleteMeeting] = useDeleteMeetingMutation();
  const [updateMeeting] = useUpdateMeetingMutation();
  
  const meetings = response?.data || [];
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteMeeting(id).unwrap();
        toast.success('Meeting deleted successfully');
        // No need to call refetch() - invalidatesTags handles this automatically
      } catch (err) {
        toast.error('Failed to delete meeting');
        console.error(err);
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateMeeting({ id, data: { status: newStatus as IMeeting['status'] } }).unwrap();
      toast.success('Status updated');
      // No need to call refetch() - invalidatesTags handles this automatically
    } catch (err) {
      toast.error('Failed to update status');
      console.error(err);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#2563eb';
      case 'completed': return '#16a34a';
      case 'cancelled': return '#dc2626';
      case 'rescheduled': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#dbeafe';
      case 'completed': return '#dcfce7';
      case 'cancelled': return '#fee2e2';
      case 'rescheduled': return '#fef3c7';
      default: return '#f3f4f6';
    }
  };

  if (isLoading) {
    return <div className="meetings-list-page"><p>Loading meetings...</p></div>;
  }

  if (error) {
    return (
      <div className="meetings-list-page">
        <p style={{ color: 'red' }}>Error loading meetings. Please try again.</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="meetings-list-page">
      <div className="meetings-header">
        <h2>Meetings</h2>
        {isAdmin && (
          <button className="btn-create-meeting" onClick={() => navigate('/meetings/new')}>
            + Create Meeting
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="meetings-filters">
        <input
          type="text"
          placeholder="Search meetings..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className="search-input"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="status-filter"
        >
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rescheduled">Rescheduled</option>
        </select>
      </div>

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <div className="no-meetings">
          <p>No meetings found.</p>
          {isAdmin && <p>Click "Create Meeting" to schedule a new meeting.</p>}
        </div>
      ) : (
        <div className="meetings-table-container">
          <table className="meetings-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Assignees</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {meetings.map((meeting) => (
                <tr key={meeting.id}>
                  <td>
                    <div className="meeting-title" onClick={() => navigate(`/meetings/${meeting.id}`)}>
                      <strong>{meeting.title}</strong>
                      {meeting.description && (
                        <span className="meeting-desc">{meeting.description.substring(0, 50)}...</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`meeting-type ${meeting.meetingType}`}>
                      {meeting.meetingType === 'online' ? <><HiOutlineGlobeAlt className="type-icon" /> Online</> : <><HiOutlineLocationMarker className="type-icon" /> Offline</>}
                    </span>
                  </td>
                  <td>{formatDateTime(meeting.startTime)}</td>
                  <td>{formatDateTime(meeting.endTime)}</td>
                  <td>
                    <div className="assignees-cell">
                      {meeting.assignees && meeting.assignees.length > 0 ? (
                        meeting.assignees.map((a, idx) => (
                          <span key={a.id} className="assignee-badge" title={a.email}>
                            {a.full_name}{idx < meeting.assignees!.length - 1 ? ', ' : ''}
                          </span>
                        ))
                      ) : (
                        <span className="no-assignees">No assignees</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {isAdmin ? (
                      <select
                        value={meeting.status}
                        onChange={(e) => handleStatusChange(meeting.id, e.target.value)}
                        className="status-select"
                        style={{
                          backgroundColor: getStatusBgColor(meeting.status),
                          color: getStatusColor(meeting.status),
                          border: `1px solid ${getStatusColor(meeting.status)}`,
                        }}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rescheduled">Rescheduled</option>
                      </select>
                    ) : (
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusBgColor(meeting.status),
                          color: getStatusColor(meeting.status),
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontWeight: 500,
                          fontSize: '0.85rem',
                        }}
                      >
                        {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => navigate(`/meetings/${meeting.id}/edit`)}
                          title="Edit meeting"
                        >
                          <HiOutlinePencil />
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(meeting.id, meeting.title)}
                          title="Delete meeting"
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MeetingsListPage;

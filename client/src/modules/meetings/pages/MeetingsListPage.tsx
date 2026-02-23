import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetMeetingsQuery } from '../api/meetingsApi';
import { useMeetingFilters } from '../hooks/useMeetingFilters';
import { useAppSelector } from '../../../hooks/redux';


const MeetingsListPage: React.FC = () => {
  const filters = useMeetingFilters();
  const navigate = useNavigate();
  // const { data: meetings = [], isLoading } = useGetMeetingsQuery({
  //   search: filters.search,
  //   status: filters.status,
  //   assignedTo: filters.assignedTo,
  //   start: filters.dateRange.start,
  //   end: filters.dateRange.end,
  // });
  // TODO: Replace with real API data
  const meetings: any[] = [];
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';

  return (
    <div className="meetings-list-page">
      <h2>Meetings</h2>
      {isAdmin && (
        <button className="btn-create-meeting" onClick={() => navigate('/meetings/new')}>Create Meeting</button>
      )}
      <ul>
        {meetings.map(m => (
          <li
            key={m._id}
            style={{ color: m.status === 'completed' ? 'green' : m.status === 'cancelled' ? 'red' : '#2563eb', cursor: 'pointer' }}
            onClick={() => navigate(`/meetings/${m._id}`)}
          >
            <strong>{m.title}</strong> ({m.startTime})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MeetingsListPage;

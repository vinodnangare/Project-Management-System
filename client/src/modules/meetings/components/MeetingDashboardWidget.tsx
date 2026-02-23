import React from 'react';
import { useGetMeetingsQuery } from '../api/meetingsApi';

export const MeetingDashboardWidget: React.FC = () => {
  const { data: meetings = [] } = useGetMeetingsQuery({ status: 'scheduled', limit: 5 });
  const today = new Date().toISOString().split('T')[0];
  const todaysMeetings = meetings.filter(m => m.startTime.startsWith(today));

  return (
    <div className="meeting-dashboard-widget">
      <h3>Today's Meetings</h3>
      <ul>
        {todaysMeetings.map(m => (
          <li key={m._id} style={{ color: '#2563eb' }}>{m.title} ({m.startTime})</li>
        ))}
      </ul>
      <h4>Upcoming Meetings</h4>
      <ul>
        {meetings.slice(0, 5).map(m => (
          <li key={m._id} style={{ color: m.status === 'completed' ? 'green' : m.status === 'cancelled' ? 'red' : '#2563eb' }}>{m.title} ({m.startTime})</li>
        ))}
      </ul>
      <button className="quick-add-btn">Quick Add Meeting</button>
    </div>
  );
};

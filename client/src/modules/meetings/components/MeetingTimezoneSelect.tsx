import React from 'react';

export interface MeetingTimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const MeetingTimezoneSelect: React.FC<MeetingTimezoneSelectProps> = ({ value, onChange }) => {
  // Placeholder for timezone select
  // TODO: Populate with timezone options
  return (
    <div className="meeting-timezone-select">
      <span>Timezone Select Placeholder</span>
    </div>
  );
};

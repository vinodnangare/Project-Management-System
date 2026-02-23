import React from 'react';

export interface MeetingAsyncSelectProps {
  value: string;
  onChange: (value: string) => void;
  loadOptions: (input: string) => Promise<Array<{ label: string; value: string }>>;
}

export const MeetingAsyncSelect: React.FC<MeetingAsyncSelectProps> = ({ value, onChange, loadOptions }) => {
  // Placeholder for async select (e.g., participants, rooms)
  // TODO: Integrate with react-select or custom async dropdown
  return (
    <div className="meeting-async-select">
      <span>Async Select Placeholder</span>
    </div>
  );
};

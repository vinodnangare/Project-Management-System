import React from 'react';

export interface MeetingValidationProps {
  errors: string[];
}

export const MeetingValidation: React.FC<MeetingValidationProps> = ({ errors }) => {
  if (errors.length === 0) return null;
  return (
    <div className="meeting-validation">
      <ul>
        {errors.map((err, idx) => (
          <li key={idx} style={{ color: 'red' }}>{err}</li>
        ))}
      </ul>
    </div>
  );
};

import React from 'react';
import { MeetingForm } from '../components/MeetingForm';

const MeetingFormPage: React.FC = () => {
  return (
    <div className="meeting-form-page">
      <h2>Create/Edit Meeting</h2>
      <MeetingForm />
    </div>
  );
};

export default MeetingFormPage;

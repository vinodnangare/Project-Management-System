import React from 'react';
import { useParams } from 'react-router-dom';
import { MeetingForm } from '../components/MeetingForm';
import '../../../styles/MeetingsList.css';

const MeetingFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  return (
    <div className="meeting-form-page">
      <h2>{isEditMode ? 'Edit Meeting' : 'Create Meeting'}</h2>
      <MeetingForm meetingId={id} />
    </div>
  );
};

export default MeetingFormPage;

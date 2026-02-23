import { useState } from 'react';

export function useMeetingValidation() {
  const [errors, setErrors] = useState<string[]>([]);

  const validate = (meeting: any) => {
    const errs: string[] = [];
    if (!meeting.title) errs.push('Title is required');
    if (!meeting.startTime) errs.push('Start time is required');
    if (!meeting.endTime) errs.push('End time is required');
    // Add more validation as needed
    setErrors(errs);
    return errs.length === 0;
  };

  return {
    errors,
    validate,
  };
}

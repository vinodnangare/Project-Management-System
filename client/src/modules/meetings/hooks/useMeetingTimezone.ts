import { useState } from 'react';

export function useMeetingTimezone(initialTimezone: string = 'UTC') {
  const [timezone, setTimezone] = useState(initialTimezone);

  return {
    timezone,
    setTimezone,
  };
}

import { useState } from 'react';

export function useMeetingFilters() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'scheduled' | 'completed' | 'cancelled' | ''>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  return {
    search,
    setSearch,
    status,
    setStatus,
    assignedTo,
    setAssignedTo,
    dateRange,
    setDateRange,
  };
}

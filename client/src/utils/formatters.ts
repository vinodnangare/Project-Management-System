export const formatIST = (value: string | Date): string => {
  const raw = value instanceof Date ? value.toISOString() : value;
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const hasTimezone = /Z|[+-]\d{2}:?\d{2}$/.test(normalized);
  const parsedDate = hasTimezone ? new Date(normalized) : new Date(`${normalized}Z`);
  
  const istDate = new Date(parsedDate.getTime() + (5.5 * 60 * 60 * 1000));
  return istDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'TODO': '#FFA500',
    'IN_PROGRESS': '#4A90E2',
    'REVIEW': '#9B59B6',
    'DONE': '#27AE60'
  };
  return statusColors[status] || '#95A5A6';
};

export const getPriorityClass = (priority: string): string => {
  return `badge-${priority.toLowerCase()}`;
};

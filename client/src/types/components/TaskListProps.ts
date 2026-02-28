import { RefObject } from 'react';
export interface TaskListProps {
  onTaskSelect: (taskId: string) => void;
  selectedTaskId?: string;
  searchInputRef?: RefObject<HTMLInputElement>;
}

export interface Filters {
  search: string;
  status: string;
  priority: string;
}

export interface TaskListProps {
  onTaskSelect: (taskId: string) => void;
  selectedTaskId?: string;
}

export interface Filters {
  search: string;
  status: string;
  priority: string;
}

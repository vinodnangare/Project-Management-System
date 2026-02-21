export interface DeadlineCardProps {
  index: number;
  title: string;
  dueDate: Date;
  priority: string;
  onSelect?: (taskId: string) => void;
}

export interface TaskStatusControlProps {
  currentStatus: string;
  isAdmin: boolean;
  isAssignedToUser: boolean;
  isUpdating: boolean;
  onStatusChange: (status: string) => void;
}

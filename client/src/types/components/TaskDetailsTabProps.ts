export interface TaskDetailsTabProps {
  task: any;
  assignees: any[];
  availableUsers: any[];
  user: any;
  isAdmin: boolean;
  onAddAssignee: (userId: string) => void;
  onRemoveAssignee: (userId: string) => void;
  statusControl: React.ReactNode;
}

export interface BulkActionsProps {
  selectedCount: number;
  onAssign?: () => void;
  onChangeStage?: (stage: string) => void;
  onChangePriority?: (priority: string) => void;
  onDelete?: () => void;
  onClearSelection: () => void;
}

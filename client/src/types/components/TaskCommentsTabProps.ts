export interface TaskCommentsTabProps {
  comments: any[];
  onAddComment: (comment: string) => Promise<void>;
  isAdding: boolean;
}

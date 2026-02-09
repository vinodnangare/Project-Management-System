import { useGetTaskCommentsQuery, useAddCommentMutation } from '../services/api';

export const useComments = (taskId: string) => {
  const { data, isLoading, error, refetch } = useGetTaskCommentsQuery(taskId);
  const [addComment, addState] = useAddCommentMutation();

  const add = async (comment: string, createdBy: string) => {
    await addComment({ taskId, comment, created_by: createdBy }).unwrap();
  };

  return {
    comments: data || [],
    loading: isLoading,
    error: error,
    refresh: refetch,
    add,
    isAdding: addState.isLoading,
    addError: addState.error
  };
};

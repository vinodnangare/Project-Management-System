import { 
  useGetTaskAssigneesQuery, 
  useGetAssignableUsersQuery,
  useAddTaskAssigneeMutation,
  useRemoveTaskAssigneeMutation
} from '../services/api';

export const useAssignees = (taskId: string) => {
  const { data, isLoading, error, refetch } = useGetTaskAssigneesQuery(taskId);
  const { data: availableUsers } = useGetAssignableUsersQuery();
  const [addAssignee, addState] = useAddTaskAssigneeMutation();
  const [removeAssignee, removeState] = useRemoveTaskAssigneeMutation();

  const add = async (userId: string) => {
    await addAssignee({ taskId, userId }).unwrap();
  };

  const remove = async (userId: string) => {
    await removeAssignee({ taskId, userId }).unwrap();
  };

  return {
    assignees: data || [],
    availableUsers: availableUsers || [],
    loading: isLoading,
    error: error,
    refresh: refetch,
    add,
    remove,
    isAdding: addState.isLoading,
    isRemoving: removeState.isLoading,
    addError: addState.error,
    removeError: removeState.error
  };
};

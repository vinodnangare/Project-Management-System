import {
  useGetSubtasksQuery,
  useCreateSubtaskMutation,
  useUpdateSubtaskStatusMutation,
  useDeleteSubtaskMutation
} from '../services/api';

export const useSubtasks = (taskId: string) => {
  const { data, isLoading, error, refetch } = useGetSubtasksQuery(taskId);
  const [createSubtask, createState] = useCreateSubtaskMutation();
  const [updateStatus, updateState] = useUpdateSubtaskStatusMutation();
  const [deleteSubtask, deleteState] = useDeleteSubtaskMutation();

  const create = async (title: string) => {
    await createSubtask({ taskId, title }).unwrap();
  };

  const updateSubtaskStatus = async (subtaskId: string, completed: boolean) => {
    await updateStatus({ taskId, subtaskId, is_completed: completed }).unwrap();
  };

  const remove = async (subtaskId: string) => {
    await deleteSubtask({ taskId, subtaskId }).unwrap();
  };

  return {
    subtasks: data || [],
    loading: isLoading,
    error: error,
    refresh: refetch,
    create,
    updateStatus: updateSubtaskStatus,
    remove,
    isCreating: createState.isLoading,
    isUpdating: updateState.isLoading,
    isDeleting: deleteState.isLoading
  };
};

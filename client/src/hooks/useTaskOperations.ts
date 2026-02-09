import { 
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation
} from '../services/api';

export const useTaskList = (filters?: any) => {
  const { data, isLoading, error, refetch } = useGetTasksQuery(filters);

  return {
    tasks: data,
    loading: isLoading,
    error: error,
    refresh: refetch
  };
};

export const useTaskDetail = (taskId: string) => {
  const { data, isLoading, error, refetch } = useGetTaskByIdQuery(taskId);

  return {
    task: data,
    loading: isLoading,
    error: error,
    refresh: refetch
  };
};

export const useTaskMutations = () => {
  const [createTask, createState] = useCreateTaskMutation();
  const [updateTask, updateState] = useUpdateTaskMutation();
  const [deleteTask, deleteState] = useDeleteTaskMutation();

  return {
    create: async (taskData: any) => await createTask(taskData).unwrap(),
    update: async (id: string, data: any) => await updateTask({ id, ...data }).unwrap(),
    delete: async (id: string) => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return await deleteTask({ id, performedBy: user.id }).unwrap();
    },
    isCreating: createState.isLoading,
    isUpdating: updateState.isLoading,
    isDeleting: deleteState.isLoading,
    createError: createState.error,
    updateError: updateState.error,
    deleteError: deleteState.error
  };
};

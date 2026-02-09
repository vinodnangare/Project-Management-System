import { useGetTasksQuery, useGetTaskByIdQuery } from '../services/api';

export const useTasks = (page = 1, limit = 10, filters?: Record<string, string>) => {
  const { data, isLoading, error } = useGetTasksQuery({
    page,
    limit,
    status: filters?.status,
    priority: filters?.priority,
    assigned_to: filters?.assigned_to
  });

  return {
    tasks: data?.tasks || [],
    loading: isLoading,
    error,
    pagination: data?.meta
  };
};

export const useTaskDetails = (taskId?: string) => {
  const { data, isLoading, error } = useGetTaskByIdQuery(taskId || '', {
    skip: !taskId
  });

  return {
    task: data || null,
    loading: isLoading,
    error
  };
};

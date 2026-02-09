import { useGetTaskActivitiesQuery } from '../services/api';

export const useActivities = (taskId: string) => {
  const { data, isLoading, error, refetch } = useGetTaskActivitiesQuery(taskId);

  return {
    activities: data || [],
    loading: isLoading,
    error: error,
    refresh: refetch
  };
};

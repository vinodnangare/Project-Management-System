import { useGetTaskStatsQuery } from '../services/api';

export const useTaskStats = () => {
  const { data, isLoading, error, refetch } = useGetTaskStatsQuery();

  return {
    stats: data,
    loading: isLoading,
    error: error,
    refresh: refetch
  };
};

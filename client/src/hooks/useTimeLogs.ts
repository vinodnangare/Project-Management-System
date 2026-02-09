import { useGetTimeLogsQuery, useLogTimeMutation } from '../services/api';

export const useTimeLogs = (startDate?: string, endDate?: string) => {
  const queryArgs = startDate && endDate ? { startDate, endDate } : { startDate: '', endDate: '' };
  const { data, isLoading, error, refetch } = useGetTimeLogsQuery(
    queryArgs,
    { skip: !startDate || !endDate }
  );
  const [logTime, logState] = useLogTimeMutation();

  const log = async (taskId: string, hours: number, description: string) => {
    await logTime({ 
      date: new Date().toISOString().split('T')[0],
      hours_worked: hours, 
      task_id: taskId || null,
      description: description || null
    }).unwrap();
  };

  return {
    timeLogs: data || [],
    loading: isLoading,
    error: error,
    refresh: refetch,
    log,
    isLogging: logState.isLoading,
    logError: logState.error
  };
};

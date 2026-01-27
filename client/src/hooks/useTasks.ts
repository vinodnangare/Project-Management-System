import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { fetchTasks, fetchTaskById } from '../store/thunks';

/**
 * Custom Hook: useTasks
 * 
 * Why custom hooks:
 * - Encapsulates API calling logic
 * - Separates data fetching from UI components
 * - Handles loading and error states
 * - Reusable across components
 * - Makes explaining data flow easy
 */

export const useTasks = () => {
  const dispatch = useAppDispatch();
  const { items: tasks, loading, error, pagination } = useAppSelector((state) => state.tasks);

  const getTasks = useCallback(
    (page = 1, limit = 10, filters?: Record<string, string>) => {
      dispatch(
        fetchTasks({ page, limit, ...filters })
      );
    },
    [dispatch]
  );

  const getTaskById = useCallback(
    (taskId: string) => {
      dispatch(fetchTaskById(taskId));
    },
    [dispatch]
  );

  return {
    tasks,
    loading,
    error,
    pagination,
    getTasks,
    getTaskById
  };
};

/**
 * Custom Hook: useTaskDetails
 * Used for fetching a single task with its comments and activities
 */
export const useTaskDetails = () => {
  const dispatch = useAppDispatch();
  const { selectedTaskId, loading, error, items } = useAppSelector((state) => state.tasks);
  const selectedTask = selectedTaskId ? items.find(t => t.id === selectedTaskId) : null;

  const fetchDetails = useCallback(
    (taskId: string) => {
      dispatch(fetchTaskById(taskId));
    },
    [dispatch]
  );

  return {
    task: selectedTask,
    loading,
    error,
    fetchDetails
  };
};

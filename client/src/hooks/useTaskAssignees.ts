import { useCallback } from 'react';
import apiClient from '../api/client';

interface Assignee {
  id: string;
  full_name: string;
  email: string;
}

export const useTaskAssignees = (taskId: string) => {
  const loadAssignees = useCallback(async () => {
    try {
      const response = await apiClient.getTaskAssignees(taskId);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error loading assignees:', error);
      return [];
    }
  }, [taskId]);

  const loadAvailableUsers = useCallback(async () => {
    try {
      const response = await apiClient.getAssignableUsers();
      return response.data?.data || [];
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }, []);

  const addAssignee = useCallback(async (userId: string) => {
    try {
      const response = await apiClient.addTaskAssignee(taskId, userId);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error adding assignee:', error);
      throw error;
    }
  }, [taskId]);

  const removeAssignee = useCallback(async (userId: string) => {
    try {
      const response = await apiClient.removeTaskAssignee(taskId, userId);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error removing assignee:', error);
      throw error;
    }
  }, [taskId]);

  return {
    loadAssignees,
    loadAvailableUsers,
    addAssignee,
    removeAssignee
  };
};

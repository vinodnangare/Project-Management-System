import { useGetLeadsQuery, useUpdateLeadStageMutation } from '../services/api';

interface UseLeadsOptions {
  page?: number;
  limit?: number;
  stage?: string;
  source?: string;
  owner?: string;
}


export const useLeads = (options?: UseLeadsOptions) => {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetLeadsQuery({
    page: options?.page || 1,
    limit: options?.limit || 20,
    stage: options?.stage,
    source: options?.source,
    owner: options?.owner,
  });

  const [updateLeadStage, { isLoading: isUpdatingStage }] = useUpdateLeadStageMutation();

  const leads = data?.leads || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 20, pages: 1 };

  return {
    // Data
    leads,
    meta,
    
    // Loading states
    isLoading,
    isFetching,
    isUpdatingStage,
    
    // Error
    error,
    
    // Actions
    refetch,
    updateLeadStage,
  };
};

export default useLeads;

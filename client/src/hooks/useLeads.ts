import { useGetLeadsQuery, useGetLeadByIdQuery, useCreateLeadMutation, useUpdateLeadMutation, useDeleteLeadMutation } from '../services/api';

interface UseLeadsOptions {
  page?: number;
  limit?: number;
  stage?: string;
  source?: string;
  owner?: string;
}

/**
 * Custom hook for managing lead data with RTK Query
 * Provides CRUD operations and pagination
 */
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

  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();
  const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();
  const [deleteLead, { isLoading: isDeleting }] = useDeleteLeadMutation();

  const leads = data?.leads || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 20, pages: 1 };

  return {
    // Data
    leads,
    meta,
    
    // Loading states
    isLoading,
    isFetching,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error
    error,
    
    // Actions
    refetch,
    createLead,
    updateLead,
    deleteLead,
  };
};

/**
 * Custom hook for fetching a single lead by ID
 */
export const useLead = (leadId: string | undefined) => {
  const {
    data: lead,
    isLoading,
    error,
    refetch,
  } = useGetLeadByIdQuery(leadId!, {
    skip: !leadId,
  });

  return {
    lead,
    isLoading,
    error,
    refetch,
  };
};

export default useLeads;

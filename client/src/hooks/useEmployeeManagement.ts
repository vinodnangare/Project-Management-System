import { useDeleteEmployeeMutation } from '../services/api';

export const useEmployeeManagement = () => {
  const [deleteEmployee, { isLoading, error }] = useDeleteEmployeeMutation();

  const remove = async (employeeId: string) => {
    await deleteEmployee(employeeId).unwrap();
  };

  return {
    remove,
    isDeleting: isLoading,
    deleteError: error
  };
};

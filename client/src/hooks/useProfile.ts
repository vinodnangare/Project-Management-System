import { useUpdateProfileMutation } from '../services/api';

export const useProfile = () => {
  const [updateProfile, { isLoading, error }] = useUpdateProfileMutation();

  const update = async (profileData: {
    username?: string;
    email?: string;
    mobile_number?: string;
    password?: string;
  }) => {
    const result = await updateProfile(profileData).unwrap();
    return result;
  };

  return {
    update,
    isUpdating: isLoading,
    updateError: error
  };
};

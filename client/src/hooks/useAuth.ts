import { useLoginMutation, useRegisterMutation } from '../services/api';

export const useAuth = () => {
  const [loginMutation, loginState] = useLoginMutation();
  const [registerMutation, registerState] = useRegisterMutation();

  const login = async (email: string, password: string) => {
    const result = await loginMutation({ email, password }).unwrap();
    return result;
  };

  const register = async (data: { 
    username: string; 
    email: string; 
    password: string;
    mobile_number?: string;
  }) => {
    const result = await registerMutation({
      email: data.email,
      password: data.password,
      full_name: data.username
    }).unwrap();
    return result;
  };

  return {
    login,
    register,
    isLoggingIn: loginState.isLoading,
    isRegistering: registerState.isLoading,
    loginError: loginState.error,
    registerError: registerState.error
  };
};

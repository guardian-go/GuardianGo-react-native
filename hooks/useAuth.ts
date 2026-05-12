import { useAuthStore } from '@/store/auth.store';

// get the auth values from the store

export const useAuth = () => {
  const { user, role, isLoading, isAuthenticated, reset } = useAuthStore();
  return { user, role, isLoading, isAuthenticated, reset };
};
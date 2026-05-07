import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

export default function IndexScreen() {
  const { isAuthenticated, role, isLoading } = useAuthStore();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (role === 'teacher' || role === 'admin') {
    return <Redirect href="/(teacher)" />;
  }

  if (role === 'parent') {
    return <Redirect href="/(parent)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

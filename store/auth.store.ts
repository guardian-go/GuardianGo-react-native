import { create } from 'zustand';
import { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  emailVerified: boolean;
  setUser: (user: User | null) => void;
  setRole: (role: UserRole | null) => void;
  setLoading: (loading: boolean) => void;
  setEmailVerified: (verified: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isLoading: true,
  isAuthenticated: false,
  emailVerified: true,

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
  }),
  setRole: (role) => set({ role }),
  setLoading: (isLoading) => set({ isLoading }),
  setEmailVerified: (emailVerified) => set({ emailVerified }),
  reset: () => set({
    user: null,
    role: null,
    isAuthenticated: false,
    emailVerified: true,
  }),
}));
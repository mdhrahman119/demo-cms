// src/store/authStore.ts

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  is_superadmin: boolean;
  role: {
    id: number;
    name: string;
  };
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: async (token: string) => {
        set({ token, isAuthenticated: true });
        try {
          // After setting the token, fetch the user's details
          const response = await api.get('/api/users/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          set({ user: response.data });
        } catch (error) {
          console.error("Failed to fetch user details after login", error);
          // If fetching user fails, log them out
          set({ token: null, user: null, isAuthenticated: false });
        }
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

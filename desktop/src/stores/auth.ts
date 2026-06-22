import { create } from 'zustand';
import { api } from '../api/client';
import type { User, LoginRequest, LoginResponse } from '@app/shared';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (input: LoginRequest) => Promise<void>;
  weworkLogin: (code: string, state: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (input) => {
    const res = await api.post<LoginResponse>('/auth/login', input);
    api.setToken(res.accessToken);
    set({ user: res.user, isAuthenticated: true });
  },

  weworkLogin: async (code, state) => {
    const res = await api.post<LoginResponse>('/auth/wework/callback', { code, state });
    api.setToken(res.accessToken);
    set({ user: res.user, isAuthenticated: true });
  },

  logout: () => {
    api.setToken(null);
    set({ user: null, isAuthenticated: false });
  },
}));

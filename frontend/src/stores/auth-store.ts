'use client';

import { create } from 'zustand';
import { authApi, type LoginPayload, type RegisterPayload } from '@/lib/api-client';

type AuthUser = { id?: string; name?: string; email: string };

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => void;
};

const saveToken = (token?: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (token) {
    window.localStorage.setItem('accessToken', token);
  } else {
    window.localStorage.removeItem('accessToken');
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  login: async (payload) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.login(payload);
      const accessToken = response.data?.tokens?.accessToken as string | undefined;
      saveToken(accessToken);
      set({
        user: { email: payload.email, name: response.data?.user?.name ?? payload.email },
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      set({ loading: false, error: 'Login failed. Please check credentials.' });
      throw error;
    }
  },
  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      await authApi.register(payload);
      set({ user: { email: payload.email, name: payload.name }, isAuthenticated: true, loading: false });
    } catch (error) {
      set({ loading: false, error: 'Registration failed. Try again.' });
      throw error;
    }
  },
  forgotPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      await authApi.forgotPassword(email);
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: 'Could not send reset link.' });
      throw error;
    }
  },
  logout: () => {
    saveToken();
    set({ user: null, isAuthenticated: false, error: null });
  },
}));

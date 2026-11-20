'use client';

import { useLogout, useMe } from '@/lib/api-hooks';
import {
  clearAuthSession,
  getAccessToken,
  getStoredUser,
  setAuthSession,
  updateStoredUser,
} from '@/lib/auth-storage';
import type { AuthUser } from '@/types/api';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginSuccess: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const hasToken = typeof window !== 'undefined' ? !!getAccessToken() : false;
  const me = useMe(bootstrapped && hasToken);
  const logoutMutation = useLogout();

  useEffect(() => {
    setUser(getStoredUser());
    setBootstrapped(true);
  }, []);

  useEffect(() => {
    if (me.data) {
      setUser(me.data);
      updateStoredUser(me.data);
    }
  }, [me.data]);

  const loginSuccess = useCallback(
    (accessToken: string, refreshToken: string, nextUser: AuthUser) => {
      setAuthSession(accessToken, refreshToken, nextUser);
      setUser(nextUser);
    },
    [],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    clearAuthSession();
    setUser(null);
  }, [logoutMutation]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading: !bootstrapped || (hasToken && me.isLoading),
      isAuthenticated: !!user && !!getAccessToken(),
      loginSuccess,
      logout,
      refreshUser: () => me.refetch(),
    }),
    [user, bootstrapped, hasToken, me, loginSuccess, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

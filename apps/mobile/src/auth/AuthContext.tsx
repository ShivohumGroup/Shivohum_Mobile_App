import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/api/auth';
import { setUnauthorizedHandler } from '@/api/client';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setStoredUser,
  setTokens,
} from '@/auth/tokenStorage';
import type { AuthUser } from '@/types/api';
import { errorMessage } from '@/lib/utils';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerOrganization: (input: {
    organizationName: string;
    organizationCode?: string;
    fullName: string;
    email: string;
    phone?: string | null;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  bootstrapError: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const clearSession = useCallback(async () => {
    await clearTokens();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const me = await authApi.me();
    setUser(me);
    await setStoredUser(JSON.stringify(me));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await getAccessToken();
        const cached = await getStoredUser<AuthUser>();
        if (cached && mounted) setUser(cached);
        if (!token) {
          if (mounted) setUser(null);
          return;
        }
        try {
          const me = await authApi.me();
          if (mounted) {
            setUser(me);
            await setStoredUser(JSON.stringify(me));
          }
        } catch {
          const refresh = await getRefreshToken();
          if (!refresh) {
            await clearSession();
            return;
          }
          try {
            const data = await authApi.refresh(refresh);
            await setTokens(data.accessToken, data.refreshToken);
            if (data.user) {
              setUser(data.user);
              await setStoredUser(JSON.stringify(data.user));
            } else {
              await refreshProfile();
            }
          } catch (err) {
            await clearSession();
            if (mounted) setBootstrapError(errorMessage(err, 'Session expired'));
          }
        }
      } catch (err) {
        if (mounted) setBootstrapError(errorMessage(err));
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [clearSession, refreshProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email.trim().toLowerCase(), password);
    await setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    await setStoredUser(JSON.stringify(data.user));
    setBootstrapError(null);
  }, []);

  const registerOrganization = useCallback(
    async (input: {
      organizationName: string;
      organizationCode?: string;
      fullName: string;
      email: string;
      phone?: string | null;
      password: string;
    }) => {
      const data = await authApi.registerOrganization(input);
      await setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      await setStoredUser(JSON.stringify(data.user));
      setBootstrapError(null);
    },
    [],
  );

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    try {
      await authApi.logout(refreshToken);
    } catch {
      // ignore network errors on logout
    }
    await clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
      login,
      registerOrganization,
      logout,
      refreshProfile,
      bootstrapError,
    }),
    [user, isLoading, login, registerOrganization, logout, refreshProfile, bootstrapError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

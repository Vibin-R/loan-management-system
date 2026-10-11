'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthenticatedHandler } from './api';
import type { Permission } from './permissions';
import { tokenStore } from './token';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

interface MeResponse {
  user: AuthUser;
  permissions: Permission[];
}

interface AuthResponse extends MeResponse {
  token: string;
}

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** True after the user clicked "Log out" (vs. a session that expired), so guards skip `?next=`. */
  signedOutByUser: boolean;
  can: (permission: Permission) => boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<ReadonlySet<Permission>>(new Set());
  const [signedOutByUser, setSignedOutByUser] = useState(false);

  const applySession = useCallback((data: MeResponse) => {
    setUser(data.user);
    setPermissions(new Set(data.permissions));
    setSignedOutByUser(false);
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback((byUser = false) => {
    tokenStore.clear();
    setUser(null);
    setPermissions(new Set());
    setSignedOutByUser(byUser);
    setStatus('anonymous');
  }, []);

  // Restore the session on first load. /auth/me always returns current permissions.
  useEffect(() => {
    if (!tokenStore.get()) {
      setStatus('anonymous');
      return;
    }
    api
      .get<MeResponse>('/auth/me')
      .then(applySession)
      .catch(() => clearSession());
  }, [applySession, clearSession]);

  // Any 401 from the API (expired token, disabled account) signs the user out. The page's
  // <RequirePermission> guard then sends them to /login?next=… so they return after logging in.
  useEffect(() => {
    setUnauthenticatedHandler(() => clearSession());
  }, [clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api.post<AuthResponse>('/auth/login', { email, password });
      tokenStore.set(data.token);
      applySession(data);
    },
    [applySession],
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await api.post<AuthResponse>('/auth/signup', { name, email, password });
      tokenStore.set(data.token);
      applySession(data);
    },
    [applySession],
  );

  const logout = useCallback(() => {
    clearSession(true);
    router.replace('/login');
  }, [clearSession, router]);

  const can = useCallback((permission: Permission) => permissions.has(permission), [permissions]);

  const value = useMemo(
    () => ({ status, user, signedOutByUser, can, login, signup, logout }),
    [status, user, signedOutByUser, can, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

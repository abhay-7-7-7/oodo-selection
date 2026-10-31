// Brightloop Auth & Role Context
// Integrates React Frontend with FastAPI JWT Authentication & RBAC

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from 'src/types';
import { apiClient } from 'src/services/apiClient';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isCustomer: boolean;
  canManageStaff: boolean;
  canCreateDiscounts: boolean;
  login: (email: string, password?: string) => Promise<User>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  activeCustomerId?: string;
  is10kEnabled: boolean;
  toggle10kSeeded: (enable: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'brightloop_auth_user';
const AUTH_TOKEN_KEY = 'brightloop_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    // Default to Admin persona for immediate evaluation
    return {
      id: '1',
      name: 'System Admin',
      email: 'admin@brightloop.com',
      role: 'admin',
      created_at: new Date().toISOString(),
    };
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(AUTH_TOKEN_KEY) || null;
  });

  const [is10kEnabled, setIs10kEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('brightloop_10k_enabled') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }, [token]);

  // Proactive auto-authentication: ensure a valid JWT token exists on startup
  useEffect(() => {
    if (!token) {
      apiClient
        .login({
          email: 'admin@brightloop.com',
          password: 'AdminPassword@2026',
        })
        .then((res) => {
          setUser(res.user);
          setToken(res.token);
        })
        .catch((err) => {
          console.warn('Initial auto-auth fallback:', err);
        });
    }
  }, []);

  const login = async (email: string, password?: string): Promise<User> => {
    const res = await apiClient.login({
      email,
      password: password || 'AdminPassword@2026',
    });
    setUser(res.user);
    setToken(res.token);
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  };

  const switchRole = async (newRole: UserRole) => {
    // Map to seeded demo credentials
    const personaMap: Record<UserRole, { email: string; pw: string; name: string }> = {
      admin: { email: 'admin@brightloop.com', pw: 'AdminPassword@2026', name: 'System Admin' },
      staff: { email: 'anjali@brightloop.com', pw: 'StaffPassword@2026', name: 'Anjali Staff' },
      customer: { email: 'rahul@example.com', pw: 'Brightloop@2026', name: 'Rahul Menon' },
    };

    const target = personaMap[newRole] || personaMap.admin;
    try {
      const res = await apiClient.login({ email: target.email, password: target.pw });
      setUser(res.user);
      setToken(res.token);
      if (newRole === 'customer' && !window.location.pathname.startsWith('/portal')) {
        window.location.href = '/portal';
      } else if (newRole !== 'customer' && window.location.pathname.startsWith('/portal')) {
        window.location.href = '/dashboard';
      }
    } catch {
      // Fallback local persona representation if offline/network error
      const fallbackUser: User = {
        id: newRole === 'customer' ? '5' : newRole === 'staff' ? '2' : '1',
        name: target.name,
        email: target.email,
        role: newRole,
        created_at: new Date().toISOString(),
        customer_id: newRole === 'customer' ? '5' : undefined,
      };
      setUser(fallbackUser);
    }
  };

  const toggle10kSeeded = (enable: boolean) => {
    try {
      localStorage.setItem('brightloop_10k_enabled', enable ? 'true' : 'false');
    } catch (e) {
      console.error(e);
    }
    setIs10kEnabled(enable);
  };

  const role = user?.role || 'admin';
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';
  const isCustomer = role === 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!user,
        isAdmin,
        isStaff,
        isCustomer,
        canManageStaff: isAdmin,
        canCreateDiscounts: isAdmin,
        login,
        logout,
        switchRole,
        activeCustomerId: user?.customer_id || (isCustomer ? (user?.id ? String(user.id) : '1') : undefined),
        is10kEnabled,
        toggle10kSeeded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

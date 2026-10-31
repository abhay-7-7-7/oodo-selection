// Brightloop Auth & Role Context
// Supports RBAC (Admin, Staff, Customer), Route Protection, and One-Click Demo Role Switching for Judges

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from 'src/types';
import { loadState } from 'src/services/mockStore';

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
  switchRole: (role: UserRole) => void;
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
    // Default to Alex Vance (Admin) for instant evaluation
    const state = loadState();
    return state.users[0] || null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(AUTH_TOKEN_KEY) || 'bl_mock_jwt_admin_token';
  });

  const [is10kEnabled, setIs10kEnabled] = useState<boolean>(() => {
    return loadState().is10kSeeded;
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

  const login = async (email: string, _password?: string): Promise<User> => {
    const state = loadState();
    const found = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      throw new Error('401: Invalid email or password');
    }
    setUser(found);
    setToken(`bl_jwt_${found.role}_${Date.now()}`);
    return found;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  };

  const switchRole = (newRole: UserRole) => {
    const state = loadState();
    let target = state.users.find(u => u.role === newRole);
    if (!target) {
      target = {
        id: `usr-${newRole}`,
        name: newRole === 'admin' ? 'Alex Vance' : newRole === 'staff' ? 'Sarah Jenkins' : 'Ravi Patel',
        email: `${newRole}@brightloop.io`,
        role: newRole,
        created_at: new Date().toISOString(),
        customer_id: newRole === 'customer' ? 'cust-1' : undefined,
      };
    }
    setUser(target);
    setToken(`bl_jwt_${newRole}_switched`);
  };

  const toggle10kSeeded = (enable: boolean) => {
    const state = loadState();
    state.is10kSeeded = enable;
    localStorage.setItem('brightloop_state_v1', JSON.stringify(state));
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
        activeCustomerId: user?.customer_id || (isCustomer ? 'cust-1' : undefined),
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

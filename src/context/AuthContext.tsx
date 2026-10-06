import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth.api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (data: {
    first_name?: string;
    last_name?: string;
    name?: string;
    email: string;
    password: string;
    department_id?: number | null;
    department?: string;
    branch?: string;
    phone?: string;
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const normalizeUser = (u: any): User => {
  if (!u) return u;
  const roleStr = String(u.role || 'user').toLowerCase();
  return {
    ...u,
    id: String(u.user_id || u.id),
    role: (roleStr === 'admin' ? 'admin' : 'user') as any,
    status: (String(u.status || 'pending').toLowerCase()) as any
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? normalizeUser(JSON.parse(stored)) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    if (!localStorage.getItem('auth_token')) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.success && res.user) {
        const normalized = normalizeUser(res.user);
        localStorage.setItem('auth_user', JSON.stringify(normalized));
        setUser(normalized);
      } else {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
      }
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const res = await authApi.login(email, password);
    setIsLoading(false);

    if (res.success && res.token && res.user) {
      const normalizedUser = normalizeUser(res.user);
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('auth_user', JSON.stringify(normalizedUser));
      setToken(res.token);
      setUser(normalizedUser);
      return { success: true, user: normalizedUser };
    }
    return { success: false, error: res.error || 'เข้าสู่ระบบไม่สำเร็จ' };
  };

  const register = async (data: {
    first_name?: string;
    last_name?: string;
    name?: string;
    email: string;
    password: string;
    department_id?: number | null;
    department?: string;
    branch?: string;
    phone?: string;
  }) => {
    const res = await authApi.register(data);
    if (res.success) {
      return { success: true, message: res.message };
    }
    return { success: false, error: res.error || 'สมัครสมาชิกไม่สำเร็จ' };
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/rooms';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser: fetchProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

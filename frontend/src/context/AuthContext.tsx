import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, AuthTokens, User } from '../types';
import { authApi, usersApi } from '../api/client';

interface AuthContextType {
  user: AuthUser | null;
  dbUser: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDbUser = async (keycloakId?: string, username?: string) => {
    try {
      const allUsers = await usersApi.getAll();
      const match = allUsers.find(
        (u) =>
          (keycloakId && u.keycloakId === keycloakId) ||
          (username && (u.name.toLowerCase().includes(username.toLowerCase()) || u.keycloakId === username))
      );
      if (match) {
        setDbUser(match);
      } else if (allUsers.length > 0) {
        // Fallback to first user or keep null
        setDbUser(null);
      }
    } catch (err) {
      console.error('Error fetching database user record:', err);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchDbUser(user.keycloakId, user.username);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken) {
      const parsed = parseJwt(storedToken);
      if (parsed) {
        const roles = parsed.realm_access?.roles || [];
        const authUserData: AuthUser = {
          id: parsed.sub,
          keycloakId: parsed.sub,
          username: parsed.preferred_username || parsed.name,
          email: parsed.email,
          name: parsed.name || parsed.preferred_username,
          roles,
          role: roles.find((r: string) => ['admin', 'manager', 'approver', 'investor', 'reviewer'].includes(r.toLowerCase())) || 'Investor',
        };
        setUser(authUserData);
        setTokens({ access_token: storedToken, expires_in: 3600, token_type: 'Bearer' });
        fetchDbUser(authUserData.keycloakId, authUserData.username);
      } else if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    const data: AuthTokens = await authApi.login(credentials);
    setTokens(data);
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }

    const parsed = parseJwt(data.access_token);
    if (parsed) {
      const roles = parsed.realm_access?.roles || [];
      const authUserData: AuthUser = {
        id: parsed.sub,
        keycloakId: parsed.sub,
        username: parsed.preferred_username || credentials.username,
        email: parsed.email,
        name: parsed.name || credentials.username,
        roles,
        role: roles.find((r: string) => ['admin', 'manager', 'approver', 'investor', 'reviewer'].includes(r.toLowerCase())) || 'Investor',
      };
      setUser(authUserData);
      localStorage.setItem('auth_user', JSON.stringify(authUserData));
      await fetchDbUser(authUserData.keycloakId, authUserData.username);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    setTokens(null);
    setUser(null);
    setDbUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        tokens,
        isAuthenticated: !!user || !!tokens,
        isLoading,
        login,
        logout,
        refreshUserData,
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


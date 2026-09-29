import PropTypes from 'prop-types';
import { createContext, useMemo, useState, useEffect } from 'react';
import { realtimeService } from 'services/websocket';

// ==============================|| AUTH CONTEXT ||============================== //

export const AuthContext = createContext(undefined);

// ==============================|| AUTH PROVIDER ||============================== //

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have a stored user on mount
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('access_token');
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        realtimeService.connect();
      }
    } catch (e) {
      console.error('Failed to parse user from local storage', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData, accessToken, refreshToken = null) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    realtimeService.connect();
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    realtimeService.disconnect();
  };

  const memoizedValue = useMemo(
    () => ({ user, isAuthenticated, loading, login, logout }),
    [user, isAuthenticated, loading]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = { children: PropTypes.node };

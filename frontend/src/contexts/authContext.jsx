// src/contexts/authContext.jsx
import React, { createContext, useContext, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize user from localStorage (if present)
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Login function that stores the user details in state and localStorage
  const login = async (username, password) => {
    try {
      setIsLoading(true);
      const result = await authService.login(username, password);
      
      // Store user info including the token
      const userData = {
        role: result.role,
        username: username,
        token: result.token
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function that clears the user state and localStorage
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

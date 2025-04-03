import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // ✅ new
  const [loading, setLoading] = useState(true);

  // ✅ Login function with role
  const login = async (username, userRole) => {
    try {
      await SecureStore.setItemAsync('isLoggedIn', 'true');
      await SecureStore.setItemAsync('username', username);
      await SecureStore.setItemAsync('role', userRole); // 🔐 save role
      setUser(username);
      setRole(userRole);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // ✅ Logout function
  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('isLoggedIn');
      await SecureStore.deleteItemAsync('username');
      await SecureStore.deleteItemAsync('role');
      setUser(null);
      setRole(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ✅ Restore session on app start
  const restoreSession = async () => {
    try {
      const loggedIn = await SecureStore.getItemAsync('isLoggedIn');
      const username = await SecureStore.getItemAsync('username');
      const userRole = await SecureStore.getItemAsync('role');

      if (loggedIn === 'true' && username && userRole) {
        setUser(username);
        setRole(userRole);
      }
    } catch (error) {
      console.error('Restore session error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

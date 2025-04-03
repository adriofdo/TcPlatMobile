import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Login function
  const login = async (username) => {
    try {
      await SecureStore.setItemAsync('isLoggedIn', 'true');
      await SecureStore.setItemAsync('username', username);
      setUser(username);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // ✅ Logout function
  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('isLoggedIn');
      await SecureStore.deleteItemAsync('username');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ✅ Restore session when app starts
  const restoreSession = async () => {
    try {
      const loggedIn = await SecureStore.getItemAsync('isLoggedIn');
      const username = await SecureStore.getItemAsync('username');

      if (loggedIn === 'true' && username) {
        setUser(username);
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
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

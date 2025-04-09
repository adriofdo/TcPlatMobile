import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // username
  const [userId, setUserId] = useState(null);   // ✅ user_id
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Login
  const login = async (username, userRole, id) => {
    try {
      await SecureStore.setItemAsync('isLoggedIn', 'true');
      await SecureStore.setItemAsync('username', username);
      await SecureStore.setItemAsync('role', userRole);
      await SecureStore.setItemAsync('user_id', id.toString()); // 🔐 store user_id

      setUser(username);
      setRole(userRole);
      setUserId(id);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // ✅ Logout
  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('isLoggedIn');
      await SecureStore.deleteItemAsync('username');
      await SecureStore.deleteItemAsync('role');
      await SecureStore.deleteItemAsync('user_id');

      setUser(null);
      setRole(null);
      setUserId(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ✅ Restore session on launch
  const restoreSession = async () => {
    try {
      const loggedIn = await SecureStore.getItemAsync('isLoggedIn');
      const username = await SecureStore.getItemAsync('username');
      const userRole = await SecureStore.getItemAsync('role');
      const id = await SecureStore.getItemAsync('user_id');

      if (loggedIn === 'true' && username && userRole && id) {
        setUser(username);
        setRole(userRole);
        setUserId(parseInt(id));
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
    <AuthContext.Provider value={{ user, userId, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

import { View, Text, Button, TouchableOpacity, StyleSheet } from 'react-native';
import { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { useRouter } from 'expo-router';

export default function ExploreScreen() {
  const { user, role, logout } = useContext(AuthContext);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Benvenuto, {user}!</Text>

      {role === 'teacher' && (
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/(tabs)/anagrafici')}>
          <Text style={styles.navButtonText}>📋 Anagrafici</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    color: '#fff',
    marginBottom: 30,
  },
  navButton: {
    backgroundColor: '#00c3ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 20,
  },
  navButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 10,
    backgroundColor: '#ff4f4f',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

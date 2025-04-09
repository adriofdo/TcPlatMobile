import { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
} from 'react-native';
import { AuthContext } from './AuthContext';
import { useRouter } from 'expo-router';
import { executeQuery } from './database';

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState('');

  const handleLogin = async () => {
    try {
      const query = 'SELECT * FROM Users WHERE username = ? AND password = ?';
      const response = await executeQuery(query, [username, password]);
      const results = response?.results || [];
  
      if (results.length > 0) {
        const user = results[0];       // ✅ Full user object from DB
        const role = user.role;
        const userId = user.user_id;   // ✅ Grab the user_id
  
        await login(username, role, userId); // ✅ Pass userId to AuthContext
        setLoginStatus('✅ Login Successful!');
        router.replace('/(tabs)/explore');
      } else {
        setLoginStatus('❌ Username o password errati');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Errore di rete', 'Verifica la connessione.');
    }
  };
  

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/TcLogo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Accedi al Portale</Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>LOGIN</Text>
      </TouchableOpacity>

      {loginStatus ? (
        <Text
          style={[
            styles.status,
            loginStatus.includes('❌') ? styles.error : styles.success,
          ]}
        >
          {loginStatus}
        </Text>
      ) : null}
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
  logo: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 350,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#00c3ff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 50,
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  status: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  success: {
    color: '#00ff88',
  },
  error: {
    color: '#ff4f4f',
  },
});

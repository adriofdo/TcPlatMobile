import { useContext, useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
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
    const query = 'SELECT * FROM User WHERE username = ? AND password = ?';
    const results = await executeQuery(query, [username, password]);

    if (results.length > 0) {
      await login(username);
      setLoginStatus('✅ Login Successful!');
      router.replace('/(tabs)');
    } else {
      setLoginStatus('❌ Invalid username or password');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Login</Text>
      <TextInput placeholder="Username" value={username} onChangeText={setUsername} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Login" onPress={handleLogin} />
      {loginStatus ? <Text style={{ marginTop: 10 }}>{loginStatus}</Text> : null}
    </View>
  );
}

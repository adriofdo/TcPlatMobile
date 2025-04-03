import { View, Text, Button } from 'react-native';
import { useContext } from 'react';
import { AuthContext } from '../AuthContext';

export default function ExploreScreen() {
  const { user, logout } = useContext(AuthContext);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome, {user}!</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}

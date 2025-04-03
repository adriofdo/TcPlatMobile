import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.glowText}>TCPLAT</Text>
      <Text style={styles.subtitle}>Esplora il futuro del colore.</Text>

      {/* ✅ Local logo image */}
      <Image
        source={require('../assets/images/TcLogo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* ✅ Button group */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
          <Text style={styles.buttonText}>Entra nel Portale</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/Registra')}>
          <Text style={styles.buttonText}>Registrati</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  glowText: {
    fontSize: 36,
    color: '#00ffff',
    fontWeight: 'bold',
    textShadowColor: '#0ff',
    textShadowRadius: 15,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 30,
    textAlign: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 30,
  },
  buttonGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 16, // React Native 0.71+ (optional fallback below)
    marginTop: 20,
  },
  button: {
    backgroundColor: '#00ffff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});

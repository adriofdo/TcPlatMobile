import React, { useState } from 'react';
import { View, TextInput, Button, Image, Text, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { executeQuery } from '../database'; // ✅ Your custom database query helper
import { useRouter } from 'expo-router';

export default function CreaEventoScreen() {
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const router = useRouter();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadToCloudinary = async (): Promise<string | null> => {
    if (!imageUri) return null;

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: 'event.jpg',
      type: 'image/jpeg',
    } as any);
    formData.append('upload_preset', 'tcplateventi'); // ✅ your preset

    const res = await fetch('https://api.cloudinary.com/v1_1/dtkfsh7pw/image/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    return data.secure_url;
  };

  const handleCreateEvent = async () => {
    try {
      const imageUrl = await uploadToCloudinary();

      const query = `
        INSERT INTO Eventi (titolo, descrizione, data_evento, immagine_url, creato_da)
        VALUES (?, ?, ?, ?, ?)
      `;

      const values = [
        titolo,
        descrizione,
        dataEvento,
        imageUrl,
        1, // TODO: Replace with actual user_id
      ];

      const res = await executeQuery(query, values);

      if (res?.insertId) {
        Alert.alert('✅ Evento creato!');
        router.back();
      } else {
        Alert.alert('❌ Errore creando evento');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('❌ Errore', 'Impossibile creare evento. Controlla la connessione o i dati.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Crea Nuovo Evento</Text>

      <TextInput placeholder="Titolo" value={titolo} onChangeText={setTitolo} style={styles.input} />
      <TextInput
        placeholder="Descrizione"
        value={descrizione}
        onChangeText={setDescrizione}
        style={styles.input}
        multiline
      />
      <TextInput
        placeholder="Data evento (es. 2025-04-10 18:30)"
        value={dataEvento}
        onChangeText={setDataEvento}
        style={styles.input}
      />

      <Button title="📷 Seleziona immagine" onPress={pickImage} />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

      <Button title="➕ Crea Evento" onPress={handleCreateEvent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  input: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  image: { width: '100%', height: 200, marginVertical: 10, borderRadius: 10 },
});
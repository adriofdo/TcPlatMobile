import React, { useState } from 'react';
import { View, TextInput, Button, Image, Text, StyleSheet, Alert, Platform, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { executeQuery } from '../database';
import { useRouter } from 'expo-router';

export default function CreaEventoScreen() {
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  const onDateChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
      const formatted = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')} ${selectedDate
        .getHours()
        .toString()
        .padStart(2, '0')}:${selectedDate.getMinutes().toString().padStart(2, '0')}`;
      setDataEvento(formatted);
    }
  };

  const showAndroidDatePicker = () => {
    DateTimePickerAndroid.open({
      value: date,
      mode: 'date',
      is24Hour: true,
      onChange: (_event, selectedDate) => {
        if (selectedDate) {
          // After picking the date, open the time picker
          const pickedDate = new Date(selectedDate);
  
          DateTimePickerAndroid.open({
            value: pickedDate,
            mode: 'time',
            is24Hour: true,
            onChange: (_e, timeDate) => {
              if (timeDate) {
                pickedDate.setHours(timeDate.getHours());
                pickedDate.setMinutes(timeDate.getMinutes());
                setDate(pickedDate);
  
                const formatted = `${pickedDate.getFullYear()}-${(pickedDate.getMonth() + 1)
                  .toString()
                  .padStart(2, '0')}-${pickedDate.getDate().toString().padStart(2, '0')} ${pickedDate
                  .getHours()
                  .toString()
                  .padStart(2, '0')}:${pickedDate.getMinutes().toString().padStart(2, '0')}`;
  
                setDataEvento(formatted);
              }
            },
          });
        }
      },
    });
  };
  

  const uploadToCloudinary = async (): Promise<string | null> => {
    if (!imageUri) return null;

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: 'event.jpg',
      type: 'image/jpeg',
    } as any);
    formData.append('upload_preset', 'tcplateventi');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dtkfsh7pw/image/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log('Cloudinary full response:', data);

      if (!data.secure_url) {
        throw new Error(data.error?.message || 'Image upload failed');
      }

      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return null;
    }
  };

  const handleCreateEvent = async () => {
    try {
      const imageUrl = await uploadToCloudinary() || 'https://via.placeholder.com/300';
      console.log('Cloudinary URL:', imageUrl);

      const query = `
        INSERT INTO Eventi (titolo, descrizione, data_evento, immagine_url, creato_da)
        VALUES (?, ?, ?, ?, ?)
      `;

      const values = [
        titolo,
        descrizione,
        dataEvento,
        imageUrl,
        1,
      ];

      const res = await executeQuery(query, values);
      console.log('Query response:', res);

      if (res?.insertId) {
        Alert.alert('✅ Evento creato!');
        router.back();
      } else {
        Alert.alert('❌ Errore creando evento');
      }
    } catch (e: any) {
      console.error('Errore dettagliato:', e);
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

      <Button
        title="🗓️ Scegli Data e Ora"
        onPress={Platform.OS === 'android' ? showAndroidDatePicker : () => setShowDatePicker(true)}
      />

      <TextInput
        placeholder="Data evento (es. 2025-04-10 18:30)"
        value={dataEvento}
        onChangeText={setDataEvento}
        style={styles.input}
      />

      {Platform.OS === 'ios' && (
        <Modal visible={showDatePicker} animationType="slide">
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <DateTimePicker
              value={date}
              mode="datetime"
              display="inline"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                onDateChange(event, selectedDate);
              }}
            />
            <Button title="Fatto" onPress={() => setShowDatePicker(false)} />
          </View>
        </Modal>
      )}

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
  dateText: {
    marginVertical: 10,
    fontSize: 16,
  },
});

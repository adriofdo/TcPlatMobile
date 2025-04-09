import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  Button,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { executeQuery } from '../database';
import { AuthContext } from '../AuthContext';

interface Evento {
  evento_id: number;
  titolo: string;
  descrizione: string;
  data_evento: string;
  immagine_url: string;
  partecipanti: { username: string; stato: string }[];
  newImageUri?: string | null;
}

export default function DettagliEventiScreen() {
  const [eventi, setEventi] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, role } = useContext(AuthContext);

  useEffect(() => {
    if (user && role === 'teacher') fetchDettagliEventi();
  }, [user]);

  const fetchDettagliEventi = async () => {
    try {
      const res = await executeQuery(`SELECT * FROM Eventi ORDER BY data_evento DESC`);

      const enriched = await Promise.all(
        (res.results || []).map(async (evento: any) => {
          const partecipantiRes = await executeQuery(
            `SELECT U.username, P.stato FROM Partecipazioni P
             JOIN Users U ON U.user_id = P.user_id
             WHERE P.evento_id = ?`,
            [evento.evento_id]
          );
          return {
            ...evento,
            partecipanti: partecipantiRes.results || [],
            newImageUri: null,
          };
        })
      );
      setEventi(enriched);
    } catch (err) {
      console.error(err);
      Alert.alert('Errore', 'Impossibile caricare i dettagli degli eventi');
    } finally {
      setLoading(false);
    }
  };

  const uploadToCloudinary = async (imageUri: string): Promise<string | null> => {
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
      return data.secure_url || null;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      return null;
    }
  };

  const pickImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const updated = [...eventi];
      updated[index].newImageUri = result.assets[0].uri;
      setEventi(updated);
    }
  };

  const handleUpdate = async (evento: Evento, index: number) => {
    try {
      let imageUrl = evento.immagine_url;
      if (evento.newImageUri) {
        const uploaded = await uploadToCloudinary(evento.newImageUri);
        if (uploaded) {
          imageUrl = uploaded;
          const updated = [...eventi];
          updated[index].immagine_url = imageUrl;
          updated[index].newImageUri = null;
          setEventi(updated);
        }
      }
  
      const formattedDate = new Date(evento.data_evento).toISOString().slice(0, 19).replace('T', ' ');
  
      await executeQuery(
        `UPDATE Eventi SET titolo = ?, descrizione = ?, data_evento = ?, immagine_url = ? WHERE evento_id = ?`,
        [evento.titolo, evento.descrizione, formattedDate, imageUrl, evento.evento_id]
      );
  
      Alert.alert('✅ Successo', 'Evento aggiornato');
    } catch (err) {
      console.error(err);
      Alert.alert('❌ Errore', "Impossibile aggiornare l'evento");
    }
  };
  

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#007aff" />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🛠️ Dettagli Eventi</Text>
      {eventi.map((evento, index) => (
        <View key={`evento-${index}`} style={styles.card}>
          <Text style={styles.label}>Titolo:</Text>
          <TextInput
            style={styles.input}
            value={evento.titolo}
            onChangeText={(text) => {
              const updated = [...eventi];
              updated[index].titolo = text;
              setEventi(updated);
            }}
          />
          <Text style={styles.label}>Data:</Text>
          <TextInput
            style={styles.input}
            value={evento.data_evento}
            onChangeText={(text) => {
              const updated = [...eventi];
              updated[index].data_evento = text;
              setEventi(updated);
            }}
          />
          <Text style={styles.label}>Descrizione:</Text>
          <TextInput
            style={styles.input}
            value={evento.descrizione}
            multiline
            onChangeText={(text) => {
              const updated = [...eventi];
              updated[index].descrizione = text;
              setEventi(updated);
            }}
          />
          <Button title="📷 Cambia Immagine" onPress={() => pickImage(index)} />
          <Image
            source={{ uri: evento.newImageUri || evento.immagine_url }}
            style={styles.image}
          />
          <Button title="Aggiorna Evento" onPress={() => handleUpdate(evento, index)} />
          <Text style={styles.subTitle}>👥 Partecipazioni:</Text>
          {evento.partecipanti.length ? (
            evento.partecipanti.map((p, i) => (
              <Text key={`p-${i}`}>- {p.username} ({p.stato})</Text>
            ))
          ) : (
            <Text>Nessun partecipante</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 20,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    borderRadius: 6,
  },
  image: {
    width: '100%',
    height: 180,
    marginBottom: 10,
    borderRadius: 8,
  },
  label: {
    fontWeight: '600',
  },
  subTitle: {
    marginTop: 10,
    fontWeight: 'bold',
  },
});

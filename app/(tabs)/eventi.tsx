import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Button, Alert } from 'react-native';
import { executeQuery } from '../database';

interface Evento {
  evento_id: number;
  titolo: string;
  descrizione: string;
  data_evento: string;
  immagine_url: string;
  partecipazione: 'SI' | 'NO' | 'PENDING' | null;
}

export default function EventiScreen() {
  const [eventi, setEventi] = useState<Evento[]>([]);
  const userId = 1; // 🔁 Replace with actual logged-in user

  useEffect(() => {
    fetchEventi();
  }, []);

  const fetchEventi = async () => {
    try {
      const res = await executeQuery(
        `SELECT E.*, P.stato AS partecipazione
         FROM Eventi E
         LEFT JOIN Partecipazioni P ON P.evento_id = E.evento_id AND P.user_id = ?
         ORDER BY E.data_evento DESC`,
        [userId]
      );
  
      const rows = res.results || res || [];
      // ✅ Filter out duplicates based on evento_id
      const uniqueEvents = rows.filter(
        (event: Evento, index: number, self: Evento[]) =>
          index === self.findIndex(e => e.evento_id === event.evento_id)
      );
  
      setEventi(uniqueEvents);
    } catch (err) {
      console.error(err);
      Alert.alert('Errore', 'Impossibile caricare gli eventi');
    }
  };
  

  const handlePartecipazione = async (evento_id: number, stato: 'SI' | 'NO') => {
    try {
      await executeQuery(
        `REPLACE INTO Partecipazioni (user_id, evento_id, stato) VALUES (?, ?, ?)`,
        [userId, evento_id, stato]
      );
      fetchEventi();
    } catch (err) {
      console.error(err);
      Alert.alert('Errore', 'Impossibile aggiornare la partecipazione');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📅 Eventi</Text>
      {eventi.map((evento) => (
        <View key={`evento-${evento.evento_id}`} style={styles.card}>
          <Text style={styles.eventTitle}>{evento.titolo}</Text>
          <Image source={{ uri: evento.immagine_url }} style={styles.image} />
          <Text style={styles.date}>{evento.data_evento}</Text>
          <Text>{evento.descrizione}</Text>
          <Text style={styles.status}>Partecipazione: {evento.partecipazione || 'PENDING'}</Text>
          <View style={styles.buttons}>
            <Button title="✅ Partecipo" onPress={() => handlePartecipazione(evento.evento_id, 'SI')} />
            <Button title="❌ Non Partecipo" onPress={() => handlePartecipazione(evento.evento_id, 'NO')} />
          </View>
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
    marginBottom: 20,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  date: {
    fontStyle: 'italic',
    marginBottom: 8,
  },
  status: {
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
});

import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { executeQuery } from '../database';
import { AuthContext } from '../AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

interface Evento {
  evento_id: number;
  titolo: string;
  descrizione: string;
  data_evento: string;
  immagine_url: string;
}

export default function IMieiEventiScreen() {
  const [eventi, setEventi] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) fetchMieiEventi();
  }, [user]);

  const fetchMieiEventi = async () => {
    try {
      const userIdRes = await executeQuery(`SELECT user_id FROM Users WHERE username = ?`, [user]);
      const userId = userIdRes.results?.[0]?.user_id;
      if (!userId) throw new Error('User not found');

      const res = await executeQuery(
        `SELECT E.* FROM Eventi E
         JOIN Partecipazioni P ON E.evento_id = P.evento_id
         WHERE P.user_id = ? AND P.stato = 'SI'
         ORDER BY E.data_evento DESC`,
        [userId]
      );

      setEventi(res.results || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Errore', 'Impossibile caricare i tuoi eventi');
    } finally {
      setLoading(false);
    }
  };



  useFocusEffect(
    useCallback(() => {
      if (user) fetchMieiEventi();
    }, [user])
  );


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007aff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🎟️ I Miei Eventi</Text>
      {eventi.length === 0 ? (
        <Text style={styles.noEvents}>Nessun evento a cui partecipi</Text>
      ) : (
        eventi.map((evento) => (
          <View key={`mio-evento-${evento.evento_id}`} style={styles.card}>
            <Text style={styles.eventTitle}>{evento.titolo}</Text>
            <Image source={{ uri: evento.immagine_url }} style={styles.image} />
            <Text style={styles.date}>{evento.data_evento}</Text>
            <Text>{evento.descrizione}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  noEvents: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
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
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 10,
  },
});

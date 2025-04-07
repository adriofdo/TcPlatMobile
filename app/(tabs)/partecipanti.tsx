import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Button, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { executeQuery } from '../database';
import { AuthContext } from '../AuthContext';

interface Evento {
  evento_id: number;
  titolo: string;
  descrizione: string;
  data_evento: string;
  immagine_url: string;
  partecipazione: 'SI' | 'NO' | 'PENDING' | null;
  partecipanti?: string[];
  mostraDettagli?: boolean;
  loading?: boolean;
}

export default function EventiScreen() {
  const [eventi, setEventi] = useState<Evento[]>([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) fetchEventi();
  }, [user]);

  const fetchEventi = async () => {
    try {
      const userIdRes = await executeQuery(`SELECT user_id FROM Users WHERE username = ?`, [user]);
      const userId = userIdRes.results?.[0]?.user_id;
      if (!userId) throw new Error('User not found');

      const res = await executeQuery(
        `SELECT E.*, COALESCE(P.stato, 'PENDING') AS partecipazione
         FROM Eventi E
         LEFT JOIN Partecipazioni P ON P.evento_id = E.evento_id AND P.user_id = ?
         ORDER BY E.data_evento DESC`,
        [userId]
      );

      const eventiData = res.results || res;

      const enrichedEventi: Evento[] = await Promise.all(
        eventiData.map(async (evento: any) => {
          const partecipantiRes = await executeQuery(
            `SELECT U.username FROM Partecipazioni P
             JOIN Users U ON U.user_id = P.user_id
             WHERE P.evento_id = ? AND P.stato = 'SI'`,
            [evento.evento_id]
          );

          const partecipazione = evento.partecipazione?.toUpperCase();

          return {
            ...evento,
            partecipazione: partecipazione === 'SI' || partecipazione === 'NO' ? partecipazione : 'PENDING',
            partecipanti: partecipantiRes.results?.map((r: any) => r.username) || [],
            mostraDettagli: false,
            loading: false,
          } as Evento;
        })
      );

      setEventi(enrichedEventi);
    } catch (err) {
      console.error(err);
      Alert.alert('Errore', 'Impossibile caricare gli eventi');
    }
  };

  const handlePartecipazione = async (evento_id: number, stato: 'SI' | 'NO') => {
    setEventi(prev => prev.map(e => e.evento_id === evento_id ? { ...e, loading: true } : e));

    try {
      const userIdRes = await executeQuery(`SELECT user_id FROM Users WHERE username = ?`, [user]);
      const userId = userIdRes.results?.[0]?.user_id;
      if (!userId) throw new Error('User ID non trovato');

      await executeQuery(
        `REPLACE INTO Partecipazioni (user_id, evento_id, stato) VALUES (?, ?, ?)`,
        [userId, evento_id, stato]
      );

      const partecipantiRes = await executeQuery(
        `SELECT U.username FROM Partecipazioni P
         JOIN Users U ON U.user_id = P.user_id
         WHERE P.evento_id = ? AND P.stato = 'SI'`,
        [evento_id]
      );

      setEventi(prev => prev.map(e =>
        e.evento_id === evento_id
          ? {
              ...e,
              partecipazione: stato,
              partecipanti: partecipantiRes.results?.map((r: any) => r.username) || [],
              loading: false,
            }
          : e
      ));
    } catch (err) {
      console.error(err);
      Alert.alert('Errore', 'Impossibile aggiornare la partecipazione');
      setEventi(prev => prev.map(e => e.evento_id === evento_id ? { ...e, loading: false } : e));
    }
  };

  const toggleDettagli = (evento_id: number) => {
    setEventi(prev => prev.map(e =>
      e.evento_id === evento_id ? { ...e, mostraDettagli: !e.mostraDettagli } : e
    ));
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
          <Text style={styles.status}>Partecipazione: {evento.partecipazione?.toLowerCase() || 'pending'}</Text>
          <View style={styles.buttons}>
            {evento.loading ? (
              <ActivityIndicator size="small" color="#007aff" />
            ) : (
              <>
                <Button
                  title="✅ Partecipo"
                  onPress={() => handlePartecipazione(evento.evento_id, 'SI')}
                  disabled={evento.partecipazione === 'SI'}
                />
                <Button
                  title="❌ Non Partecipo"
                  onPress={() => handlePartecipazione(evento.evento_id, 'NO')}
                  disabled={evento.partecipazione === 'NO'}
                />
              </>
            )}
          </View>
          <TouchableOpacity onPress={() => toggleDettagli(evento.evento_id)}>
            <Text style={styles.toggle}>👥 {evento.partecipanti?.length || 0} partecipanti — {evento.mostraDettagli ? 'Nascondi' : 'Mostra'}</Text>
          </TouchableOpacity>
          {evento.mostraDettagli && (
            <View style={styles.partecipantiList}>
              {evento.partecipanti?.length ? (
                evento.partecipanti.map((username, idx) => (
                  <Text key={`p-${evento.evento_id}-${username}-${idx}`} style={styles.partecipante}>
                    👤 {username}
                  </Text>
                ))
              ) : (
                <Text>Nessun partecipante</Text>
              )}
            </View>
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
  toggle: {
    marginTop: 10,
    fontWeight: '600',
    color: '#007aff',
  },
  partecipantiList: {
    marginTop: 8,
    paddingLeft: 10,
  },
  partecipante: {
    fontSize: 14,
    paddingVertical: 2,
  },
});
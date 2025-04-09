import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { executeQuery } from '../database';
import { AuthContext } from '../AuthContext';

export default function CreaGruppoScreen() {
  const { user } = useContext(AuthContext);
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [isRoutine, setIsRoutine] = useState(false);
  const [utenti, setUtenti] = useState<{ user_id: number; username: string }[]>([]);
  const [selezionati, setSelezionati] = useState<number[]>([]);
  const [routineMap, setRoutineMap] = useState<Record<number, string[]>>({}); // user_id => giorni

  const giorni = ['LUN', 'MAR', 'MER', 'GIO', 'VEN'];

  useEffect(() => {
    fetchUtenti();
  }, []);

  const fetchUtenti = async () => {
    const res = await executeQuery('SELECT user_id, username FROM Users');
    setUtenti(res.results || []);
  };

  const toggleUser = (userId: number) => {
    setSelezionati(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleGiorno = (userId: number, giorno: string) => {
    setRoutineMap(prev => {
      const days = prev[userId] || [];
      return {
        ...prev,
        [userId]: days.includes(giorno)
          ? days.filter(g => g !== giorno)
          : [...days, giorno],
      };
    });
  };

  const handleCreaGruppo = async () => {
    try {
      const userRes = await executeQuery('SELECT user_id FROM Users WHERE username = ?', [user]);
      const creatorId = userRes.results?.[0]?.user_id;
      if (!creatorId) throw new Error('Utente non trovato');

      const res = await executeQuery(
        'INSERT INTO Gruppi (titolo, descrizione, creato_da, is_routine) VALUES (?, ?, ?, ?)',
        [titolo, descrizione, creatorId, isRoutine ? 1 : 0]
      );

      const gruppoId = res.insertId;
      if (!gruppoId) throw new Error('Errore creazione gruppo');

      for (const userId of selezionati) {
        await executeQuery('INSERT INTO GruppoUtenti (gruppo_id, user_id) VALUES (?, ?)', [gruppoId, userId]);
      }

      if (isRoutine) {
        for (const [userId, giorni] of Object.entries(routineMap)) {
          for (const giorno of giorni) {
            await executeQuery(
              'INSERT INTO RoutineAssegnazioni (gruppo_id, user_id, giorno_settimana) VALUES (?, ?, ?)',
              [gruppoId, parseInt(userId), giorno]
            );
          }
        }
      }

      Alert.alert('Successo', 'Gruppo creato');
      setTitolo('');
      setDescrizione('');
      setSelezionati([]);
      setIsRoutine(false);
      setRoutineMap({});
    } catch (err) {
      console.error(err);
      Alert.alert('Errore', 'Impossibile creare il gruppo');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>➕ Crea Gruppo</Text>
      <TextInput style={styles.input} placeholder="Titolo" value={titolo} onChangeText={setTitolo} />
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Descrizione"
        multiline
        value={descrizione}
        onChangeText={setDescrizione}
      />
      <View style={styles.switchContainer}>
        <Text>Routine?</Text>
        <Switch value={isRoutine} onValueChange={setIsRoutine} />
      </View>

      <Text style={styles.subTitle}>👥 Seleziona Membri:</Text>
      {utenti.map((u) => (
        <View key={u.user_id} style={styles.userRow}>
          <TouchableOpacity onPress={() => toggleUser(u.user_id)}>
            <Text style={{ color: selezionati.includes(u.user_id) ? 'blue' : 'black' }}>{u.username}</Text>
          </TouchableOpacity>
          {isRoutine && selezionati.includes(u.user_id) && (
            <View style={styles.daysRow}>
              {giorni.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => toggleGiorno(u.user_id, g)}
                  style={{ marginHorizontal: 4 }}
                >
                  <Text
                    style={{
                      padding: 4,
                      borderWidth: 1,
                      borderColor: '#ccc',
                      borderRadius: 4,
                      backgroundColor: routineMap[u.user_id]?.includes(g) ? '#cce5ff' : '#f0f0f0',
                    }}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}

      <Button title="✅ Crea Gruppo" onPress={handleCreaGruppo} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  subTitle: {
    marginTop: 10,
    fontWeight: '600',
    marginBottom: 6,
  },
  userRow: {
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
});

import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { executeQuery } from '../database';
import { AuthContext } from '../AuthContext';
import DropDownPicker from 'react-native-dropdown-picker';
import { Int32 } from 'react-native/Libraries/Types/CodegenTypes';



const giorniSettimana = [
    { label: 'Lunedì', value: 'LUN' },
    { label: 'Martedì', value: 'MAR' },
    { label: 'Mercoledì', value: 'MER' },
    { label: 'Giovedì', value: 'GIO' },
    { label: 'Venerdì', value: 'VEN' },
    { label: 'Sabato', value: 'SAB' },
    { label: 'Domenica', value: 'DOM' },
  ];
  interface Gruppo {
    gruppo_id: number;
    titolo: string;
    descrizione: string;
    creato_da: string;
    routine: Record<string, string[]>;
    membri: { user_id: number; username: string; giorno_settimana?: string }[];
    newMemberUserId?: number;
    newMemberDay?: string;
    dropdownOpen: boolean;
    dayDropdownOpen: boolean; // ✅ Needed for the days dropdown to work properly
  }
  
  


export default function GestioneGruppiScreen() {
  const [gruppi, setGruppi] = useState<Gruppo[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<{ label: string; value: number }[]>([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchGruppi();
    }
  }, [user]);

  const fetchUsers = async () => {
    const res = await executeQuery(`SELECT user_id, username FROM Users`);
    const options = res.results?.map((u: any) => ({ label: u.username, value: u.user_id })) || [];
    setAllUsers(options);
  };

  const fetchGruppi = async () => {
    try {
      const gruppiRes = await executeQuery(`SELECT * FROM Gruppi`);
      const gruppiData = gruppiRes.results || [];

      const enriched = await Promise.all(
        gruppiData.map(async (g: any) => {
          const membriRes = await executeQuery(
            `SELECT U.user_id, U.username, R.giorno_settimana
             FROM GruppoUtenti GU
             JOIN Users U ON U.user_id = GU.user_id
             LEFT JOIN RoutineAssegnazioni R ON R.gruppo_id = GU.gruppo_id AND R.user_id = GU.user_id
             WHERE GU.gruppo_id = ?`,
            [g.gruppo_id]
          );

          const routineByDay: Record<string, string[]> = {};
          membriRes.results?.forEach((m: any) => {
            if (m.giorno_settimana) {
              if (!routineByDay[m.giorno_settimana]) routineByDay[m.giorno_settimana] = [];
              routineByDay[m.giorno_settimana].push(m.username);
            }
          });

          return {
            ...g,
            membri: membriRes.results || [],
            routine: routineByDay,
            newMemberUserId: undefined,
            newMemberDay: '',
            dropdownOpen: false,
          };
        })
      );

      setGruppi(enriched);
    } catch (err) {
      console.error(err);
      Alert.alert('Errore', 'Impossibile caricare i gruppi');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGruppo = async (gruppo: Gruppo) => {
    try {
      await executeQuery(
        `UPDATE Gruppi SET titolo = ?, descrizione = ? WHERE gruppo_id = ?`,
        [gruppo.titolo, gruppo.descrizione, gruppo.gruppo_id]
      );
      Alert.alert('✅ Gruppo aggiornato');
    } catch (err) {
      console.error(err);
      Alert.alert('Errore', 'Impossibile aggiornare il gruppo');
    }
  };

  const handleAddMember = async (gruppo: Gruppo, index: number) => {
    try {
      if (!gruppo.newMemberUserId) {
        Alert.alert('Seleziona un utente');
        return;
      }

      await executeQuery(`INSERT IGNORE INTO GruppoUtenti (gruppo_id, user_id) VALUES (?, ?)`, [gruppo.gruppo_id, gruppo.newMemberUserId]);

      if (gruppo.newMemberDay) {
        await executeQuery(
          `REPLACE INTO RoutineAssegnazioni (gruppo_id, user_id, giorno_settimana) VALUES (?, ?, ?)`,
          [gruppo.gruppo_id, gruppo.newMemberUserId, gruppo.newMemberDay]
        );
      }

      Alert.alert('✅ Membro aggiunto');
      fetchGruppi();
    } catch (err) {
      console.error(err);
      Alert.alert('Errore', 'Impossibile aggiungere il membro');
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#007aff" />;
  }

  return (
    <FlatList
      data={gruppi}
      keyExtractor={(g) => `gruppo-${g.gruppo_id}`}
      contentContainerStyle={styles.container}
      renderItem={({ item: g, index }) => (
        <View style={styles.card}>
          <Text style={styles.label}>Titolo:</Text>
          <TextInput
            value={g.titolo}
            onChangeText={(text) => {
              const updated = [...gruppi];
              updated[index].titolo = text;
              setGruppi(updated);
            }}
            style={styles.input}
          />
          <Text style={styles.label}>Descrizione:</Text>
          <TextInput
            value={g.descrizione}
            onChangeText={(text) => {
              const updated = [...gruppi];
              updated[index].descrizione = text;
              setGruppi(updated);
            }}
            style={styles.input}
          />

          <Button title="Aggiorna Gruppo" onPress={() => handleUpdateGruppo(g)} />

          <Text style={styles.subTitle}>👥 Membri:</Text>
          {g.membri?.length ? (
            g.membri.map((m, i) => (
              <Text key={`m-${i}`}>
                - {m.username} {m.giorno_settimana ? `(🗓 ${m.giorno_settimana})` : ''}
              </Text>
            ))
          ) : (
            <Text>Nessun membro</Text>
          )}

          <Text style={styles.label}>➕ Aggiungi Membro:</Text>

          <View style={{ zIndex: 1000 }}>

          <DropDownPicker
  items={allUsers}
  open={g.dropdownOpen}
  value={g.newMemberUserId ?? null}
  setOpen={(cb) => {
    const updated = [...gruppi];
    updated[index].dropdownOpen = typeof cb === 'function' ? cb(g.dropdownOpen) : cb;
    setGruppi(updated);
  }}
  setValue={(cb) => {
    const updated = [...gruppi];
    const newVal = typeof cb === 'function' ? cb(g.newMemberUserId) : cb;
    updated[index].newMemberUserId = newVal ?? undefined;
    setGruppi(updated);
  }}
  setItems={() => {}}
  placeholder="Seleziona un utente"
  style={styles.input}
/>


          </View>

          <View style={{ zIndex: 999 }}>
          <View style={{ zIndex: 999 }}>
          <DropDownPicker
  items={giorniSettimana}
  open={g.dayDropdownOpen}
  value={g.newMemberDay || null}
  setOpen={(callback) => {
    const updated = [...gruppi];
    updated[index].dayDropdownOpen = typeof callback === 'function' ? callback(updated[index].dayDropdownOpen) : callback;
    setGruppi(updated);
  }}
  setValue={(callback) => {
    const updated = [...gruppi];
    const value = typeof callback === 'function' ? callback(updated[index].newMemberDay) : callback;
    updated[index].newMemberDay = value as string;
    setGruppi(updated);
  }}
  setItems={() => {}}
  placeholder="Seleziona un giorno"
  style={styles.input}
/>

</View>


</View>


          <Button title="Aggiungi" onPress={() => handleAddMember(g, index)} />

          <Text style={styles.subTitle}>📅 Routine:</Text>
          {Object.entries(g.routine || {}).map(([day, members], i) => (
            <Text key={`routine-${i}`}>{day}: {members.join(', ')}</Text>
          ))}
        </View>
      )}
    />
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
    backgroundColor: '#f0f0f0',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    borderRadius: 6,
  },
  label: {
    fontWeight: '600',
  },
  subTitle: {
    marginTop: 10,
    fontWeight: 'bold',
  },
});

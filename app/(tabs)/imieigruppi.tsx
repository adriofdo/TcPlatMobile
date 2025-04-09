import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { executeQuery } from '../database';
import { AuthContext } from '../AuthContext';

interface Gruppo {
  gruppo_id: number;
  titolo: string;
  descrizione: string;
  creato_da: string;
  giorno_settimana?: string;
}

export default function IMieiGruppiScreen() {
  const { user } = useContext(AuthContext);
  const [gruppi, setGruppi] = useState<Gruppo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMieiGruppi();
  }, [user]);

  const fetchMieiGruppi = async () => {
    try {
      const res = await executeQuery(
        `SELECT G.gruppo_id, G.titolo, G.descrizione, G.creato_da, R.giorno_settimana
         FROM GruppoUtenti GU
         JOIN Gruppi G ON G.gruppo_id = GU.gruppo_id
         LEFT JOIN RoutineAssegnazioni R ON R.gruppo_id = GU.gruppo_id AND R.user_id = GU.user_id
         WHERE GU.user_id = ?`,
        [user.user_id]
      );
      setGruppi(res.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#007aff" />;
  }

  return (
    <FlatList
      data={gruppi}
      keyExtractor={(item) => `gruppo-${item.gruppo_id}`}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.titolo}</Text>
          <Text style={styles.label}>Descrizione: {item.descrizione}</Text>
          <Text style={styles.label}>Creato da: {item.creato_da}</Text>
          {item.giorno_settimana && (
            <Text style={styles.label}>Giorno Assegnato: 📅 {item.giorno_settimana}</Text>
          )}
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
  card: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    marginBottom: 2,
  },
});

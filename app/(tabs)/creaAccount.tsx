import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { DataTable, Button, Modal, Portal, TextInput as PaperInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { executeQuery } from '../database';

// ✅ Define the data structure
type AnagraficaRow = {
  anagrafica_id: number;
  nome: string;
  cognome: string;
  data_nascita: string;
  scuola: string;
  indirizzo: string;
  codice_fiscale: string;
  paese_nascita: string;
  realta_frq: string;
  AccCreato: number;
};

export default function AnagraficiScreen() {
  const [data, setData] = useState<AnagraficaRow[]>([]);
  const [filtered, setFiltered] = useState<AnagraficaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '' });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchAnagrafica();
  }, []);

  const fetchAnagrafica = async () => {
    try {
      setLoading(true);
      const res = await executeQuery('SELECT * FROM Anagrafica', []);
      const rows = res?.results || [];
      setData(rows);
      setFiltered(rows);
    } catch (err) {
      console.error('Error fetching data:', err);
      Alert.alert('Errore', 'Impossibile caricare i dati');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    const filteredResults = data.filter((item) =>
      `${item.nome} ${item.cognome} ${item.codice_fiscale}`
        .toLowerCase()
        .includes(text.toLowerCase())
    );
    setFiltered(filteredResults);
  };

  const handleEdit = (id: number, field: keyof AnagraficaRow, value: string) => {
    setFiltered((prev) =>
      prev.map((item) =>
        item.anagrafica_id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSave = async (row: AnagraficaRow) => {
    try {
      await executeQuery(
        `UPDATE Anagrafica SET nome = ?, cognome = ?, data_nascita = ?, scuola = ?, indirizzo = ?, codice_fiscale = ?, paese_nascita = ?, realta_frq = ? WHERE anagrafica_id = ?`,
        [
          row.nome,
          row.cognome,
          row.data_nascita,
          row.scuola,
          row.indirizzo,
          row.codice_fiscale,
          row.paese_nascita,
          row.realta_frq,
          row.anagrafica_id,
        ]
      );
      Alert.alert('✅ Salvato', 'I dati sono stati aggiornati.');
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('❌ Errore salvataggio');
    }
  };

  const handleCreateAccount = (anagrafica_id: number) => {
    setSelectedId(anagrafica_id);
    setModalVisible(true);
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email) {
      Alert.alert('Errore', 'Compila tutti i campi');
      return;
    }

    try {
      await executeQuery(
        `INSERT INTO Users (username, email, role, date_of_birth, anagrafica_id, state_acc) 
         VALUES (?, ?, 'student', CURDATE(), ?, 0)`,
        [newUser.username, newUser.email, selectedId]
      );

      await executeQuery(
        `UPDATE Anagrafica SET AccCreato = 1 WHERE anagrafica_id = ?`,
        [selectedId]
      );

      Alert.alert('✅ Utente creato');
      setModalVisible(false);
      setNewUser({ username: '', email: '' });
      fetchAnagrafica(); // refresh table
    } catch (err) {
      console.error('Create user error:', err);
      Alert.alert('Errore', 'Creazione account fallita');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>👥 Anagrafici</Text>

      <TextInput
        style={styles.search}
        placeholder="🔍 Cerca per nome, cognome, CF..."
        value={search}
        onChangeText={handleSearch}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#00c3ff" />
      ) : (
        <ScrollView horizontal>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Nome</DataTable.Title>
              <DataTable.Title>Cognome</DataTable.Title>
              <DataTable.Title>CF</DataTable.Title>
              <DataTable.Title>Scuola</DataTable.Title>
              <DataTable.Title>Azioni</DataTable.Title>
            </DataTable.Header>

            {filtered.map((row) => (
              <DataTable.Row key={row.anagrafica_id}>
                <DataTable.Cell>
                  <TextInput
                    style={styles.cellInput}
                    value={row.nome}
                    onChangeText={(text) => handleEdit(row.anagrafica_id, 'nome', text)}
                  />
                </DataTable.Cell>
                <DataTable.Cell>
                  <TextInput
                    style={styles.cellInput}
                    value={row.cognome}
                    onChangeText={(text) => handleEdit(row.anagrafica_id, 'cognome', text)}
                  />
                </DataTable.Cell>
                <DataTable.Cell>
                  <TextInput
                    style={styles.cellInput}
                    value={row.codice_fiscale}
                    onChangeText={(text) => handleEdit(row.anagrafica_id, 'codice_fiscale', text)}
                  />
                </DataTable.Cell>
                <DataTable.Cell>
                  <TextInput
                    style={styles.cellInput}
                    value={row.scuola}
                    onChangeText={(text) => handleEdit(row.anagrafica_id, 'scuola', text)}
                  />
                </DataTable.Cell>
                <DataTable.Cell>
                  <Button
                    mode="contained"
                    compact
                    onPress={() => handleSave(row)}
                    style={{ backgroundColor: '#00c3ff', marginBottom: 6 }}
                  >
                    Salva
                  </Button>
                  {row.AccCreato === 0 && (
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => handleCreateAccount(row.anagrafica_id)}
                    >
                      Crea Acc
                    </Button>
                  )}
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </ScrollView>
      )}

      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>Crea Account</Text>

          <PaperInput
            label="Username"
            value={newUser.username}
            onChangeText={(text) => setNewUser({ ...newUser, username: text })}
            style={styles.input}
          />
          <PaperInput
            label="Email"
            value={newUser.email}
            onChangeText={(text) => setNewUser({ ...newUser, email: text })}
            style={styles.input}
          />

          <Button mode="contained" onPress={handleCreateUser}>
            Crea
          </Button>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  search: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  cellInput: {
    fontSize: 14,
    padding: 6,
    borderBottomWidth: 1,
    borderColor: '#eee',
    minWidth: 100,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
});

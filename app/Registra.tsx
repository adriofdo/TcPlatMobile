import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { executeQuery } from './database';
import { useRouter } from 'expo-router';

type FormFields =
  | 'nome'
  | 'cognome'
  | 'dataDiNascita'
  | 'scuola'
  | 'indirizzo'
  | 'codiceFiscale'
  | 'paeseDiNascita'
  | 'realtaFRQ'
  | 'email';

const initialForm: Record<FormFields, string> = {
  nome: '',
  cognome: '',
  dataDiNascita: '',
  scuola: '',
  indirizzo: '',
  codiceFiscale: '',
  paeseDiNascita: '',
  realtaFRQ: '',
  email: '',
};

export default function RegistraScreen() {
  const [form, setForm] = useState(initialForm);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();

  const handleChange = (key: FormFields, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    try {
      for (const key in form) {
        const value = form[key as FormFields];
        if (!value || value.trim() === '') {
          Alert.alert('⚠️ Campo mancante', `Compila il campo: ${key}`);
          return;
        }
      }

      const dataMySQLFormat = form.dataDiNascita.replace(
        /(\d{2})-(\d{2})-(\d{4})/,
        '$3-$2-$1'
      );

      const {
        nome,
        cognome,
        scuola,
        indirizzo,
        codiceFiscale,
        paeseDiNascita,
        realtaFRQ,
        email,
      } = form;

      const anagraficaInsert = await executeQuery(
        `INSERT INTO Anagrafica 
         (nome, cognome, data_nascita, scuola, indirizzo, codice_fiscale, paese_nascita, realta_frq, AccCreato)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          nome,
          cognome,
          dataMySQLFormat,
          scuola,
          indirizzo,
          codiceFiscale,
          paeseDiNascita,
          realtaFRQ,
        ]
      );

      if (!anagraficaInsert || !anagraficaInsert.insertId) {
        console.error('❌ Failed to insert Anagrafica:', anagraficaInsert);
        Alert.alert('❌ Errore DB', 'Impossibile salvare i dati anagrafici.');
        return;
      }

      Alert.alert('✅ Registrazione completata!', '', [
        {
          text: 'OK',
          onPress: () => router.replace('./index'), // 👈 Redirect to index
        },
      ]);

      setForm(initialForm);
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      Alert.alert('❌ Errore inatteso', error.message || 'Errore sconosciuto');
    }
  };

  const renderField = (field: FormFields) => {
    if (field === 'dataDiNascita') {
      return (
        <TouchableOpacity
          key={field}
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text
            style={{
              fontSize: 16,
              color: form.dataDiNascita ? '#000' : '#aaa',
            }}
          >
            {form.dataDiNascita || 'Seleziona la data di nascita'}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TextInput
        key={field}
        placeholder={field}
        style={styles.input}
        value={form[field]}
        onChangeText={(val) => handleChange(field, val)}
      />
    );
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.wrapper}>
        <View style={styles.card}>
          <Text style={styles.title}>✨ Registrazione Studente ✨</Text>

          {Object.keys(initialForm).map((field) =>
            renderField(field as FormFields)
          )}

          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>REGISTRATI</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={
            form.dataDiNascita
              ? new Date(
                  form.dataDiNascita.replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1')
                )
              : new Date()
          }
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              const yyyy = selectedDate.getFullYear();
              const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
              const dd = String(selectedDate.getDate()).padStart(2, '0');
              const formatted = `${dd}-${mm}-${yyyy}`;
              handleChange('dataDiNascita', formatted);
            }
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0a0a0a',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#00c3ff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

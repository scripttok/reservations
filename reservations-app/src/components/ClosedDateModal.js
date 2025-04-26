import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function ClosedDateModal({ onSave, onClose }) {
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSave = () => {
    if (!date || !reason) {
      alert('Por favor, preencha a data e o motivo.');
      return;
    }

    onSave(date, reason);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adicionar Dia Fechado</Text>
      <Text style={styles.label}>Data (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="Ex: 2025-05-10"
      />
      <Text style={styles.label}>Motivo</Text>
      <TextInput
        style={styles.input}
        value={reason}
        onChangeText={setReason}
        placeholder="Digite o motivo"
        multiline
      />
      <View style={styles.buttonContainer}>
        <Button title="Salvar" onPress={handleSave} color={COLORS.primary} />
        <Button title="Cancelar" onPress={onClose} color={COLORS.closed} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.available,
    padding: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.text,
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    fontSize: 16,
    color: COLORS.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});

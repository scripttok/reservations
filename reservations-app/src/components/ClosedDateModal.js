import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
} from 'react-native';
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
    <View style={styles.modalContainer}>
      <ScrollView contentContainerStyle={styles.modalContent}>
        <Text style={styles.modalTitle}>Adicionar Dia Fechado</Text>
        <Text style={styles.label}>Data (DD-MM-AAAA)</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="Ex.: 28-04-2025"
          placeholderTextColor={COLORS.closed}
        />
        <Text style={styles.label}>Motivo</Text>
        <TextInput
          style={styles.input}
          value={reason}
          onChangeText={setReason}
          placeholder="Digite o motivo"
          placeholderTextColor={COLORS.closed}
          multiline
        />
        <View style={styles.buttonContainer}>
          <Button title="Salvar" onPress={handleSave} color={COLORS.primary} />
          <Button title="Cancelar" onPress={onClose} color={COLORS.closed} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 15,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.available,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});

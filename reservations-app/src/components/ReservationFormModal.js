import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { isValid, parse, format, parseISO } from 'date-fns';
import { COLORS } from '../constants/colors';

export default function ReservationFormModal({
  selectedDate,
  onSave,
  onClose,
}) {
  const [clientName, setClientName] = useState('');
  const [startDate, setStartDate] = useState(
    selectedDate ? format(parseISO(selectedDate), 'dd-MM-yyyy') : ''
  );
  const [endDate, setEndDate] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [notes, setNotes] = useState('');

  const validateDate = (dateStr) => {
    const parsed = parse(dateStr, 'dd-MM-yyyy', new Date());
    return isValid(parsed) && dateStr.match(/^\d{2}-\d{2}-\d{4}$/);
  };

  const handleSave = () => {
    if (
      !clientName ||
      !startDate ||
      !endDate ||
      !paidAmount ||
      !remainingAmount
    ) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!validateDate(startDate)) {
      Alert.alert(
        'Erro',
        'Data inicial inválida. Use o formato DD-MM-AAAA (ex.: 28-04-2025).'
      );
      return;
    }

    if (!validateDate(endDate)) {
      Alert.alert(
        'Erro',
        'Data final inválida. Use o formato DD-MM-AAAA (ex.: 01-05-2025).'
      );
      return;
    }

    const start = parse(startDate, 'dd-MM-yyyy', new Date());
    const end = parse(endDate, 'dd-MM-yyyy', new Date());

    if (end < start) {
      Alert.alert(
        'Erro',
        'A data final deve ser igual ou posterior à data inicial.'
      );
      return;
    }

    if (isNaN(parseFloat(paidAmount)) || isNaN(parseFloat(remainingAmount))) {
      Alert.alert(
        'Erro',
        'Os valores pago e restante devem ser números válidos.'
      );
      return;
    }

    const reservation = {
      clientName,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      paidAmount: parseFloat(paidAmount),
      remainingAmount: parseFloat(remainingAmount),
      notes,
    };

    onSave(reservation);
  };

  return (
    <View style={styles.modalContainer}>
      <ScrollView contentContainerStyle={styles.modalContent}>
        <Text style={styles.modalTitle}>Nova Reserva</Text>
        <Text style={styles.label}>Nome do Cliente</Text>
        <TextInput
          style={styles.input}
          value={clientName}
          onChangeText={setClientName}
          placeholder="Digite o nome"
          placeholderTextColor={COLORS.closed}
        />
        <Text style={styles.label}>Data Inicial (DD-MM-AAAA)</Text>
        <TextInput
          style={styles.input}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="Ex.: 28-04-2025"
          placeholderTextColor={COLORS.closed}
        />
        <Text style={styles.label}>Data Final (DD-MM-AAAA)</Text>
        <TextInput
          style={styles.input}
          value={endDate}
          onChangeText={setEndDate}
          placeholder="Ex.: 01-05-2025"
          placeholderTextColor={COLORS.closed}
        />
        <Text style={styles.label}>Valor Pago</Text>
        <TextInput
          style={styles.input}
          value={paidAmount}
          onChangeText={setPaidAmount}
          keyboardType="numeric"
          placeholder="Digite o valor"
          placeholderTextColor={COLORS.closed}
        />
        <Text style={styles.label}>Valor Restante</Text>
        <TextInput
          style={styles.input}
          value={remainingAmount}
          onChangeText={setRemainingAmount}
          keyboardType="numeric"
          placeholder="Digite o valor"
          placeholderTextColor={COLORS.closed}
        />
        <Text style={styles.label}>Observação</Text>
        <TextInput
          style={styles.input}
          value={notes}
          onChangeText={setNotes}
          placeholder="Opcional"
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

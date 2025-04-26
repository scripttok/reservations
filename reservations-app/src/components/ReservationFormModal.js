import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/colors';

export default function ReservationFormModal({
  selectedDate,
  reservation,
  onSave,
  onClose,
}) {
  const [clientName, setClientName] = useState('');
  const [startDate, setStartDate] = useState(selectedDate || '');
  const [endDate, setEndDate] = useState(selectedDate || '');
  const [paidAmount, setPaidAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Preencher campos se for edição
  useEffect(() => {
    if (reservation) {
      setClientName(reservation.clientName || '');
      setStartDate(reservation.startDate || '');
      setEndDate(reservation.endDate || '');
      setPaidAmount(reservation.paidAmount?.toString() || '');
      setRemainingAmount(reservation.remainingAmount?.toString() || '');
      setNotes(reservation.notes || '');
    }
  }, [reservation]);

  const handleSave = () => {
    if (
      !clientName ||
      !startDate ||
      !endDate ||
      !paidAmount ||
      !remainingAmount
    ) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const updatedReservation = {
      clientName,
      startDate,
      endDate,
      paidAmount: parseFloat(paidAmount),
      remainingAmount: parseFloat(remainingAmount),
      notes,
    };

    onSave(updatedReservation);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>
          {reservation ? 'Editar Reserva' : 'Nova Reserva'}
        </Text>
        <Text style={styles.label}>Nome do Cliente</Text>
        <TextInput
          style={styles.input}
          value={clientName}
          onChangeText={setClientName}
          placeholder="Digite o nome"
        />
        <Text style={styles.label}>Data Inicial</Text>
        <TextInput
          style={styles.input}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
        />
        <Text style={styles.label}>Data Final</Text>
        <TextInput
          style={styles.input}
          value={endDate}
          onChangeText={setEndDate}
          placeholder="YYYY-MM-DD"
        />
        <Text style={styles.label}>Valor Pago</Text>
        <TextInput
          style={styles.input}
          value={paidAmount}
          onChangeText={setPaidAmount}
          keyboardType="numeric"
          placeholder="Digite o valor"
        />
        <Text style={styles.label}>Valor Restante</Text>
        <TextInput
          style={styles.input}
          value={remainingAmount}
          onChangeText={setRemainingAmount}
          keyboardType="numeric"
          placeholder="Digite o valor"
        />
        <Text style={styles.label}>Observação</Text>
        <TextInput
          style={styles.input}
          value={notes}
          onChangeText={setNotes}
          placeholder="Opcional"
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
  container: {
    backgroundColor: COLORS.available,
    padding: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  scrollContent: {
    paddingBottom: 20,
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

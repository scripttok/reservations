import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import {
  isValid,
  parse,
  format,
  parseISO,
  getDay,
  startOfWeek,
  addDays,
  endOfMonth,
  isSameDay,
} from 'date-fns';
import { COLORS } from '../constants/colors';

export default function ReservationFormModal({
  selectedDate,
  onSave,
  onClose,
}) {
  const [clientName, setClientName] = useState('');
  const [startDate, setStartDate] = useState(
    selectedDate && selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)
      ? format(parseISO(selectedDate), 'dd-MM-yyyy')
      : ''
  );
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecurrent, setIsRecurrent] = useState(false);

  console.log(
    'ReservationFormModal inicializado com selectedDate:',
    selectedDate
  );

  const validateDate = (dateStr) => {
    console.log('Validando data:', dateStr);
    if (!dateStr) {
      console.log('Data vazia');
      return false;
    }
    const parsed = parse(dateStr, 'dd-MM-yyyy', new Date());
    const isValidDate = isValid(parsed) && dateStr.match(/^\d{2}-\d{2}-\d{4}$/);
    console.log('Resultado da validação de data:', isValidDate);
    return isValidDate;
  };

  const validateTime = (timeStr) => {
    console.log('Validando horário:', timeStr);
    if (!timeStr) {
      console.log('Horário vazio');
      return false;
    }
    const isValidTime = timeStr.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/);
    console.log('Resultado da validação de horário:', isValidTime);
    return isValidTime;
  };

  const generateRecurrentDates = (start) => {
    console.log('Gerando datas recorrentes para:', start);
    try {
      const startParsed = parse(start, 'dd-MM-yyyy', new Date());
      if (!isValid(startParsed)) {
        console.error('Data inicial inválida para recorrência:', start);
        return [];
      }
      const monthEnd = endOfMonth(startParsed);
      const dayOfWeek = getDay(startParsed); // 0 (Domingo) a 6 (Sábado)
      console.log('startParsed:', startParsed.toISOString());
      console.log('monthEnd:', monthEnd.toISOString());
      console.log('dayOfWeek:', dayOfWeek);

      const dates = [];
      let currentDate = startParsed;

      while (currentDate <= monthEnd) {
        if (
          getDay(currentDate) === dayOfWeek &&
          !isSameDay(currentDate, startParsed)
        ) {
          dates.push(format(currentDate, 'yyyy-MM-dd'));
        }
        currentDate = addDays(currentDate, 1);
      }

      console.log('Datas recorrentes geradas:', dates);
      // Incluir a data inicial
      dates.unshift(format(startParsed, 'yyyy-MM-dd'));
      console.log('Datas recorrentes finais (com startDate):', dates);
      return dates;
    } catch (error) {
      console.error('Erro ao gerar datas recorrentes:', error);
      return [];
    }
  };

  const handleSave = () => {
    console.log('Iniciando handleSave com valores:', {
      clientName,
      startDate,
      endDate,
      startTime,
      endTime,
      paidAmount,
      remainingAmount,
      notes,
      isRecurrent,
    });

    // Verificar campos obrigatórios
    if (!clientName) {
      console.log('Erro: Nome do cliente vazio');
      Alert.alert('Erro', 'Por favor, preencha o nome do cliente.');
      return;
    }
    if (!startDate) {
      console.log('Erro: Data inicial vazia');
      Alert.alert('Erro', 'Por favor, preencha a data inicial.');
      return;
    }
    if (!endDate) {
      console.log('Erro: Data final vazia');
      Alert.alert('Erro', 'Por favor, preencha a data final.');
      return;
    }
    if (!startTime) {
      console.log('Erro: Horário inicial vazio');
      Alert.alert('Erro', 'Por favor, preencha o horário inicial.');
      return;
    }
    if (!endTime) {
      console.log('Erro: Horário final vazio');
      Alert.alert('Erro', 'Por favor, preencha o horário final.');
      return;
    }
    if (!paidAmount) {
      console.log('Erro: Valor pago vazio');
      Alert.alert('Erro', 'Por favor, preencha o valor pago.');
      return;
    }
    if (!remainingAmount) {
      console.log('Erro: Valor restante vazio');
      Alert.alert('Erro', 'Por favor, preencha o valor restante.');
      return;
    }

    // Validar formatos
    if (!validateDate(startDate)) {
      console.log('Erro: Data inicial inválida');
      Alert.alert(
        'Erro',
        'Data inicial inválida. Use o formato DD-MM-AAAA (ex.: 28-04-2025).'
      );
      return;
    }

    if (!validateDate(endDate)) {
      console.log('Erro: Data final inválida');
      Alert.alert(
        'Erro',
        'Data final inválida. Use o formato DD-MM-AAAA (ex.: 01-05-2025).'
      );
      return;
    }

    if (!validateTime(startTime)) {
      console.log('Erro: Horário inicial inválido');
      Alert.alert(
        'Erro',
        'Horário inicial inválido. Use o formato HH:MM (ex.: 10:00).'
      );
      return;
    }

    if (!validateTime(endTime)) {
      console.log('Erro: Horário final inválido');
      Alert.alert(
        'Erro',
        'Horário final inválido. Use o formato HH:MM (ex.: 15:00).'
      );
      return;
    }

    const start = parse(startDate, 'dd-MM-yyyy', new Date());
    const end = parse(endDate, 'dd-MM-yyyy', new Date());

    if (end < start) {
      console.log('Erro: Data final anterior à inicial');
      Alert.alert(
        'Erro',
        'A data final deve ser igual ou posterior à data inicial.'
      );
      return;
    }

    if (isNaN(parseFloat(paidAmount)) || isNaN(parseFloat(remainingAmount))) {
      console.log('Erro: Valores financeiros inválidos');
      Alert.alert(
        'Erro',
        'Os valores pago e restante devem ser números válidos.'
      );
      return;
    }

    const reservations = [];
    if (isRecurrent) {
      const recurrentDates = generateRecurrentDates(startDate);
      console.log('Datas recorrentes retornadas:', recurrentDates);
      if (recurrentDates.length === 0) {
        console.log('Erro: Nenhuma data recorrente gerada');
        Alert.alert(
          'Erro',
          'Falha ao gerar datas recorrentes. Verifique a data inicial.'
        );
        return;
      }
      recurrentDates.forEach((date) => {
        reservations.push({
          clientName,
          startDate: date,
          endDate: date,
          startTime,
          endTime,
          paidAmount: parseFloat(paidAmount),
          remainingAmount: parseFloat(remainingAmount),
          notes,
          isRecurrent: true,
        });
      });
    } else {
      reservations.push({
        clientName,
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
        startTime,
        endTime,
        paidAmount: parseFloat(paidAmount),
        remainingAmount: parseFloat(remainingAmount),
        notes,
        isRecurrent: false,
      });
    }

    console.log('Reservas geradas para envio:', reservations);
    if (reservations.length === 0) {
      console.log('Erro: Nenhuma reserva gerada');
      Alert.alert(
        'Erro',
        'Nenhuma reserva foi gerada. Verifique os dados fornecidos.'
      );
      return;
    }

    onSave(reservations);
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
        <Text style={styles.label}>Horário Inicial (HH:MM)</Text>
        <TextInput
          style={styles.input}
          value={startTime}
          onChangeText={setStartTime}
          placeholder="Ex.: 10:00"
          placeholderTextColor={COLORS.closed}
        />
        <Text style={styles.label}>Horário Final (HH:MM)</Text>
        <TextInput
          style={styles.input}
          value={endTime}
          onChangeText={setEndTime}
          placeholder="Ex.: 15:00"
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
        <View style={styles.recurrenceContainer}>
          <Text style={styles.label}>Recorrência</Text>
          <Switch
            value={isRecurrent}
            onValueChange={setIsRecurrent}
            trackColor={{ false: COLORS.closed, true: COLORS.primary }}
            thumbColor={COLORS.text}
          />
        </View>
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
  recurrenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});

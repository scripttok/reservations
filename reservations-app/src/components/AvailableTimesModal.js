import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  TextInput,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  parse,
  format,
  addHours,
  isWithinInterval,
  isSameDay,
  isValid,
  endOfMonth,
  getDay,
  addDays,
  parseISO,
  differenceInHours,
} from 'date-fns';
import { getReservations } from '../services/firebase';
import { COLORS } from '../constants/colors';

const AvailableTimesModal = ({ selectedDate, onSave, onClose }) => {
  const [availableTimes, setAvailableTimes] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [availableEndTimes, setAvailableEndTimes] = useState([]);
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [clientName, setClientName] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Gerar todos os horários possíveis (08:00 a 22:00, intervalos de 1 hora)
  const allTimes = [];
  for (let hour = 8; hour <= 21; hour++) {
    allTimes.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  // Função para gerar datas recorrentes
  const generateRecurrentDates = (start) => {
    console.log('Gerando datas recorrentes para:', start);
    try {
      const startParsed = parse(start, 'yyyy-MM-dd', new Date());
      if (!isValid(startParsed)) {
        console.error('Data inicial inválida para recorrência:', start);
        return [];
      }
      const monthEnd = endOfMonth(startParsed);
      const dayOfWeek = getDay(startParsed);
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
      dates.unshift(start);
      console.log('Datas recorrentes finais (com startDate):', dates);
      return dates;
    } catch (error) {
      console.error('Erro ao gerar datas recorrentes:', error);
      return [];
    }
  };

  // Carregar reservas e calcular horários disponíveis
  useEffect(() => {
    console.log('Verificando importações: parse existe?', !!parse);
    if (!selectedDate) {
      console.log('selectedDate é null, pulando loadReservations');
      setAvailableTimes([]);
      setAvailableEndTimes([]);
      setStartTime('');
      setEndTime('');
      setIsLoading(false);
      return;
    }

    const loadReservations = async () => {
      console.log(
        'Iniciando loadReservations para selectedDate:',
        selectedDate
      );
      try {
        setIsLoading(true);
        console.log('Carregando reservas...');
        const reservations = await getReservations();
        console.log('Reservas carregadas:', reservations);
        console.log('Filtrando reservas para o dia:', selectedDate);
        const parsedDate = parse(selectedDate, 'yyyy-MM-dd', new Date());
        if (!isValid(parsedDate)) {
          console.error('Data selecionada inválida:', selectedDate);
          setAvailableTimes([]);
          setAvailableEndTimes([]);
          return;
        }
        const dayReservations = reservations.filter((res) => {
          const resDate = parseISO(res.startDate);
          return isSameDay(resDate, parsedDate);
        });
        console.log('Reservas do dia:', dayReservations);

        // Calcular horários iniciais disponíveis
        const availableStartTimes = allTimes.filter((time) => {
          const startTimeParsed = parse(time, 'HH:mm', new Date());
          return !dayReservations.some((res) => {
            const resStart = parse(res.startTime, 'HH:mm', new Date());
            const resEnd = parse(res.endTime, 'HH:mm', new Date());
            return isWithinInterval(startTimeParsed, {
              start: resStart,
              end: resEnd,
            });
          });
        });

        console.log('Horários iniciais disponíveis:', availableStartTimes);
        setAvailableTimes(availableStartTimes);

        if (availableStartTimes.length > 0) {
          setStartTime(availableStartTimes[0]);
        } else {
          setStartTime('');
          setAvailableEndTimes([]);
          setEndTime('');
        }
      } catch (error) {
        console.error('Erro ao carregar reservas:', error);
        Alert.alert('Erro', 'Falha ao carregar horários disponíveis.');
      } finally {
        setIsLoading(false);
        console.log('loadReservations concluído');
      }
    };

    loadReservations();
  }, [selectedDate]);

  // Atualizar horários finais disponíveis quando startTime mudar
  useEffect(() => {
    if (!startTime || !selectedDate) {
      setAvailableEndTimes([]);
      setEndTime('');
      return;
    }

    const calculateEndTimes = async () => {
      console.log('Calculando horários finais para startTime:', startTime);
      try {
        const reservations = await getReservations();
        const parsedDate = parse(selectedDate, 'yyyy-MM-dd', new Date());
        const dayReservations = reservations.filter((res) => {
          const resDate = parseISO(res.startDate);
          return isSameDay(resDate, parsedDate);
        });

        const startTimeParsed = parse(startTime, 'HH:mm', new Date());
        const availableEndTimes = allTimes.filter((time) => {
          const endTimeParsed = parse(time, 'HH:mm', new Date());
          // Verificar se endTime é pelo menos 1 hora após startTime
          const duration = differenceInHours(endTimeParsed, startTimeParsed);
          if (duration < 1) return false;

          // Verificar se o intervalo startTime a endTime é válido
          return !dayReservations.some((res) => {
            const resStart = parse(res.startTime, 'HH:mm', new Date());
            const resEnd = parse(res.endTime, 'HH:mm', new Date());
            // Verifica se o intervalo proposto sobrepõe alguma reserva
            return (
              isWithinInterval(startTimeParsed, {
                start: resStart,
                end: resEnd,
              }) ||
              isWithinInterval(endTimeParsed, {
                start: resStart,
                end: resEnd,
              }) ||
              (startTimeParsed <= resStart && endTimeParsed >= resEnd)
            );
          });
        });

        console.log('Horários finais disponíveis:', availableEndTimes);
        setAvailableEndTimes(availableEndTimes);
        if (availableEndTimes.length > 0) {
          setEndTime(availableEndTimes[0]);
        } else {
          setEndTime('');
        }
      } catch (error) {
        console.error('Erro ao calcular horários finais:', error);
        setAvailableEndTimes([]);
        setEndTime('');
      }
    };

    calculateEndTimes();
  }, [startTime, selectedDate]);

  // Manipular reserva de horário personalizado
  const handleSaveTime = () => {
    console.log('Iniciando handleSaveTime com:', {
      clientName,
      selectedDate,
      startTime,
      endTime,
      isRecurrent,
      paidAmount,
      remainingAmount,
      notes,
    });

    if (!clientName) {
      Alert.alert('Erro', 'Por favor, preencha o nome do cliente.');
      return;
    }
    if (!startTime) {
      Alert.alert('Erro', 'Por favor, selecione um horário inicial.');
      return;
    }
    if (!endTime) {
      Alert.alert('Erro', 'Por favor, selecione um horário final.');
      return;
    }
    if (!paidAmount || isNaN(parseFloat(paidAmount))) {
      Alert.alert('Erro', 'Por favor, preencha um valor pago válido.');
      return;
    }
    if (!remainingAmount || isNaN(parseFloat(remainingAmount))) {
      Alert.alert('Erro', 'Por favor, preencha um valor restante válido.');
      return;
    }

    const startTimeParsed = parse(startTime, 'HH:mm', new Date());
    const endTimeParsed = parse(endTime, 'HH:mm', new Date());
    if (differenceInHours(endTimeParsed, startTimeParsed) < 1) {
      Alert.alert('Erro', 'O intervalo deve ser de pelo menos 1 hora.');
      return;
    }

    const reservations = [];
    if (isRecurrent) {
      const recurrentDates = generateRecurrentDates(selectedDate);
      if (recurrentDates.length === 0) {
        Alert.alert('Erro', 'Falha ao gerar datas recorrentes.');
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
        startDate: selectedDate,
        endDate: selectedDate,
        startTime,
        endTime,
        paidAmount: parseFloat(paidAmount),
        remainingAmount: parseFloat(remainingAmount),
        notes,
        isRecurrent: false,
      });
    }

    console.log('Reservas geradas:', reservations);
    onSave(reservations);
  };

  // Manipular reserva do dia todo
  const handleSaveFullDay = () => {
    console.log('Iniciando handleSaveFullDay com:', {
      clientName,
      selectedDate,
      isRecurrent,
      paidAmount,
      remainingAmount,
      notes,
    });

    if (!clientName) {
      Alert.alert('Erro', 'Por favor, preencha o nome do cliente.');
      return;
    }
    if (!paidAmount || isNaN(parseFloat(paidAmount))) {
      Alert.alert('Erro', 'Por favor, preencha um valor pago válido.');
      return;
    }
    if (!remainingAmount || isNaN(parseFloat(remainingAmount))) {
      Alert.alert('Erro', 'Por favor, preencha um valor restante válido.');
      return;
    }

    const reservations = [];
    const startTime = '08:00';
    const endTime = '22:00';

    if (isRecurrent) {
      const recurrentDates = generateRecurrentDates(selectedDate);
      if (recurrentDates.length === 0) {
        Alert.alert('Erro', 'Falha ao gerar datas recorrentes.');
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
        startDate: selectedDate,
        endDate: selectedDate,
        startTime,
        endTime,
        paidAmount: parseFloat(paidAmount),
        remainingAmount: parseFloat(remainingAmount),
        notes,
        isRecurrent: false,
      });
    }

    console.log('Reservas geradas (dia todo):', reservations);
    onSave(reservations);
  };

  return (
    <View style={styles.modalContainer}>
      <ScrollView style={styles.modalContent}>
        <Text style={styles.modalTitle}>Reservar {selectedDate || 'Data'}</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : availableTimes.length === 0 ? (
          <Text style={styles.noTimesText}>Nenhum horário disponível.</Text>
        ) : (
          <>
            <Text style={styles.label}>Nome do Cliente</Text>
            <TextInput
              style={styles.input}
              value={clientName}
              onChangeText={setClientName}
              placeholder="Digite o nome"
              placeholderTextColor={COLORS.closed}
            />
            <Text style={styles.label}>Horário Inicial</Text>
            <Picker
              selectedValue={startTime}
              onValueChange={(itemValue) => setStartTime(itemValue)}
              style={styles.picker}
              enabled={availableTimes.length > 0}
            >
              {availableTimes.length === 0 ? (
                <Picker.Item label="Nenhum horário disponível" value="" />
              ) : (
                availableTimes.map((time) => (
                  <Picker.Item key={time} label={time} value={time} />
                ))
              )}
            </Picker>
            <Text style={styles.label}>Horário Final</Text>
            <Picker
              selectedValue={endTime}
              onValueChange={(itemValue) => setEndTime(itemValue)}
              style={styles.picker}
              enabled={availableEndTimes.length > 0}
            >
              {availableEndTimes.length === 0 ? (
                <Picker.Item
                  label="Selecione um horário inicial válido"
                  value=""
                />
              ) : (
                availableEndTimes.map((time) => (
                  <Picker.Item key={time} label={time} value={time} />
                ))
              )}
            </Picker>
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
              <Button
                title="Reservar Horário"
                onPress={handleSaveTime}
                color={COLORS.primary}
                disabled={availableTimes.length === 0 || !startTime || !endTime}
              />
              <Button
                title="Reservar Dia Todo"
                onPress={handleSaveFullDay}
                color={COLORS.primary}
              />
              <Button
                title="Cancelar"
                onPress={onClose}
                color={COLORS.closed}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

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
  picker: {
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
    flexDirection: 'column',
    marginTop: 20,
    gap: 10,
  },
  noTimesText: {
    fontSize: 16,
    color: COLORS.closed,
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default AvailableTimesModal;

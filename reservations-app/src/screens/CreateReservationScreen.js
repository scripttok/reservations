import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Button,
  ActivityIndicator,
  FlatList,
  Text,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Modal from 'react-native-modal';
import { LocaleConfig } from 'react-native-calendars';
import AvailableTimesModal from '../components/AvailableTimesModal';
import ClosedDateModal from '../components/ClosedDateModal';
import {
  format,
  parseISO,
  eachDayOfInterval,
  isSameDay,
  addDays,
} from 'date-fns';
import {
  getReservations,
  getClosedDates,
  createReservation,
  addClosedDate,
} from '../services/firebase';
import { COLORS } from '../constants/colors';

export default function CreateReservationScreen() {
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTimesModal, setShowTimesModal] = useState(false);
  const [showClosedDateModal, setShowClosedDateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expiringReservations, setExpiringReservations] = useState([]);

  // Carregar dados do Firebase
  useEffect(() => {
    console.log('Verificando importações: parseISO existe?', !!parseISO);
    const loadData = async () => {
      console.log('Iniciando loadData');
      try {
        setIsLoading(true);
        console.log('Carregando reservas...');
        const reservations = await getReservations();
        console.log('Reservas carregadas:', reservations);
        console.log('Carregando dias fechados...');
        const closedDates = await getClosedDates();
        console.log('Dias fechados carregados:', closedDates);

        const marked = {};
        console.log('Inicializando marked:', marked);

        // Marcar dias ocupados
        reservations.forEach((res) => {
          console.log('Processando reserva:', res);
          const days = eachDayOfInterval({
            start: parseISO(res.startDate),
            end: parseISO(res.endDate),
          }).map((day) => format(day, 'yyyy-MM-dd'));

          days.forEach((day) => {
            marked[day] = {
              selected: true,
              selectedColor: res.isRecurrent ? COLORS.primary : COLORS.occupied,
              reservation: res,
            };
          });
        });

        // Marcar dias fechados
        Object.keys(closedDates).forEach((date) => {
          console.log('Marcando dia fechado:', date);
          marked[date] = {
            selected: true,
            selectedColor: COLORS.closed,
            reason: closedDates[date].reason,
          };
        });

        // Identificar reservas que expiram amanhã
        const tomorrow = addDays(new Date(), 1);
        console.log('Verificando expirações para amanhã:', tomorrow);
        const expiring = reservations.filter((res) =>
          isSameDay(parseISO(res.endDate), tomorrow)
        );
        console.log('Reservas expirando amanhã:', expiring);
        setExpiringReservations(expiring);

        console.log('marked antes de setMarkedDates:', marked);
        setMarkedDates(marked);
        console.log('markedDates inicializado:', marked);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        Alert.alert('Erro', 'Falha ao carregar dados. Tente novamente.');
      } finally {
        setIsLoading(false);
        console.log('loadData concluído');
      }
    };

    loadData();
  }, []);

  LocaleConfig.locales['pt-BR'] = {
    monthNames: [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ],
    monthNamesShort: [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ],
    dayNames: [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ],
    dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    today: 'Hoje',
  };

  LocaleConfig.defaultLocale = 'pt-BR';

  const handleDayPress = (day) => {
    const date = day.dateString;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.log('Data inválida selecionada:', date);
      return;
    }
    setSelectedDate(date);
    setShowTimesModal(true);
    console.log('Dia selecionado:', date);
  };

  const handleSaveReservation = async (reservations) => {
    console.log('Iniciando handleSaveReservation com reservas:', reservations);
    try {
      setIsLoading(true);
      console.log('Chamando createReservation com:', reservations);
      const savedReservations = await createReservation(reservations);
      console.log('Reservas salvas com sucesso:', savedReservations);
      Alert.alert('Sucesso', 'Reserva(s) criada(s) com sucesso!');
      setShowTimesModal(false);

      const newMarked = { ...markedDates };
      console.log('newMarked inicializado:', newMarked);
      for (const reservation of reservations) {
        console.log('Atualizando markedDates para reserva:', reservation);
        const days = eachDayOfInterval({
          start: parseISO(reservation.startDate),
          end: parseISO(reservation.endDate),
        }).map((day) => format(day, 'yyyy-MM-dd'));

        days.forEach((day) => {
          newMarked[day] = {
            selected: true,
            selectedColor: reservation.isRecurrent
              ? COLORS.primary
              : COLORS.occupied,
            reservation,
          };
        });
      }

      const tomorrow = addDays(new Date(), 1);
      const expiring = reservations.filter((res) =>
        isSameDay(parseISO(res.endDate), tomorrow)
      );
      console.log('Reservas expirando amanhã:', expiring);
      setExpiringReservations(expiring);

      console.log('newMarked antes de setMarkedDates:', newMarked);
      setMarkedDates(newMarked);
      console.log('markedDates atualizado:', newMarked);
    } catch (error) {
      console.error('Erro em handleSaveReservation:', error);
      Alert.alert('Erro', `Falha ao salvar reserva(s): ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveClosedDate = async (date, reason) => {
    try {
      setIsLoading(true);
      await addClosedDate(date, reason);
      Alert.alert('Sucesso', 'Dia fechado adicionado!');
      setShowClosedDateModal(false);

      const newMarked = {
        ...markedDates,
        [date]: {
          selected: true,
          selectedColor: COLORS.closed,
          reason,
        },
      };
      setMarkedDates(newMarked);
      console.log('markedDates atualizado:', newMarked);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderExpiringItem = ({ item }) => (
    <View style={styles.expiringCard}>
      <Text style={styles.expiringText}>
        Reserva de {item.clientName} ({item.startDate} {item.startTime}-
        {item.endTime}) expira amanhã!
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
      <Button
        title="Adicionar Dia Fechado"
        onPress={() => setShowClosedDateModal(true)}
        color={COLORS.primary}
      />
      <Calendar
        markedDates={markedDates}
        onDayPress={handleDayPress}
        locale="pt-BR"
        theme={{
          backgroundColor: COLORS.background,
          calendarBackground: COLORS.available,
          textSectionTitleColor: COLORS.text,
          selectedDayBackgroundColor: COLORS.primary,
          selectedDayTextColor: COLORS.text,
          todayTextColor: COLORS.primary,
          dayTextColor: COLORS.text,
          textDisabledColor: COLORS.closed,
          arrowColor: COLORS.primary,
          monthTextColor: COLORS.primary,
          textDayFontWeight: '400',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
        }}
      />
      {expiringReservations.length > 0 && (
        <View style={styles.expiringContainer}>
          <Text style={styles.expiringTitle}>Reservas Expirando Amanhã</Text>
          <FlatList
            data={expiringReservations}
            renderItem={renderExpiringItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.expiringList}
          />
        </View>
      )}
      <Modal
        isVisible={showTimesModal}
        onBackdropPress={() => setShowTimesModal(false)}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <AvailableTimesModal
          selectedDate={selectedDate}
          onSave={handleSaveReservation}
          onClose={() => setShowTimesModal(false)}
        />
      </Modal>
      <Modal
        isVisible={showClosedDateModal}
        onBackdropPress={() => setShowClosedDateModal(false)}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <ClosedDateModal
          onSave={handleSaveClosedDate}
          onClose={() => setShowClosedDateModal(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  expiringContainer: {
    marginTop: 15,
  },
  expiringTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  expiringList: {
    paddingBottom: 10,
  },
  expiringCard: {
    backgroundColor: COLORS.available,
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  expiringText: {
    fontSize: 14,
    color: COLORS.text,
  },
});

import { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Button } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Modal from 'react-native-modal';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { LocaleConfig } from 'react-native-calendars';
import {
  getReservations,
  getClosedDates,
  createReservation,
  addClosedDate,
} from '../services/firebase';
import DetailsModal from '../components/DetailsModal';
import ReservationFormModal from '../components/ReservationFormModal';
import ClosedDateModal from '../components/ClosedDateModal';
import { COLORS } from '../constants/colors';

export default function CreateReservationScreen() {
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showClosedDateModal, setShowClosedDateModal] = useState(false);
  const [reservationDetails, setReservationDetails] = useState(null);

  // Carregar dados do Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        const reservations = await getReservations();
        const closedDates = await getClosedDates();
        const marked = {};

        // Marcar dias ocupados
        reservations.forEach((res) => {
          const days = eachDayOfInterval({
            start: parseISO(res.startDate),
            end: parseISO(res.endDate),
          }).map((day) => format(day, 'yyyy-MM-dd'));

          days.forEach((day) => {
            marked[day] = {
              selected: true,
              selectedColor: COLORS.occupied,
              reservation: res,
            };
          });
        });

        // Marcar dias fechados
        Object.keys(closedDates).forEach((date) => {
          marked[date] = {
            selected: true,
            selectedColor: COLORS.closed,
            reason: closedDates[date].reason,
          };
        });

        setMarkedDates(marked);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
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

  // Definir o locale padrão
  LocaleConfig.defaultLocale = 'pt-BR';

  // Manipular clique no dia
  const handleDayPress = (day) => {
    const date = day.dateString;
    setSelectedDate(date);

    if (markedDates[date]) {
      // Dia ocupado ou fechado: exibir detalhes
      setReservationDetails(markedDates[date]);
      setShowDetailsModal(true);
    } else {
      // Dia disponível: abrir formulário
      setShowFormModal(true);
    }
  };

  // Salvar nova reserva
  const handleSaveReservation = async (reservation) => {
    try {
      await createReservation(reservation);
      Alert.alert('Sucesso', 'Reserva criada com sucesso!');
      setShowFormModal(false);

      // Atualizar calendário
      const days = eachDayOfInterval({
        start: parseISO(reservation.startDate),
        end: parseISO(reservation.endDate),
      }).map((day) => format(day, 'yyyy-MM-dd'));

      const newMarked = { ...markedDates };
      days.forEach((day) => {
        newMarked[day] = {
          selected: true,
          selectedColor: COLORS.occupied,
          reservation,
        };
      });

      setMarkedDates(newMarked);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  // Salvar dia fechado
  const handleSaveClosedDate = async (date, reason) => {
    try {
      await addClosedDate(date, reason);
      Alert.alert('Sucesso', 'Dia fechado adicionado!');
      setShowClosedDateModal(false);

      // Atualizar calendário
      const newMarked = {
        ...markedDates,
        [date]: {
          selected: true,
          selectedColor: COLORS.closed,
          reason,
        },
      };
      setMarkedDates(newMarked);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  return (
    <View style={styles.container}>
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
          selectedDayTextColor: '#ffffff',
          todayTextColor: COLORS.primary,
          dayTextColor: COLORS.text,
          textDisabledColor: '#d9e1e8',
          arrowColor: COLORS.primary,
        }}
      />
      <Modal
        isVisible={showDetailsModal}
        onBackdropPress={() => setShowDetailsModal(false)}
      >
        <DetailsModal
          details={reservationDetails}
          onClose={() => setShowDetailsModal(false)}
        />
      </Modal>
      <Modal
        isVisible={showFormModal}
        onBackdropPress={() => setShowFormModal(false)}
      >
        <ReservationFormModal
          selectedDate={selectedDate}
          onSave={handleSaveReservation}
          onClose={() => setShowFormModal(false)}
        />
      </Modal>
      <Modal
        isVisible={showClosedDateModal}
        onBackdropPress={() => setShowClosedDateModal(false)}
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
  },
});

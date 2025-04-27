import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Animated,
} from 'react-native';
import Modal from 'react-native-modal';
import { onValue, ref } from 'firebase/database';
import {
  database,
  ensureAuthenticated,
  checkAndMoveExpiredReservations,
  createReservation,
} from '../services/firebase';
import DetailsModal from '../components/DetailsModal';
import { COLORS } from '../constants/colors';
import {
  format,
  parseISO,
  isSameDay,
  addDays,
  addMonths,
  getDay,
  eachWeekOfInterval,
  endOfMonth,
} from 'date-fns';

export default function ReservationsScreen() {
  const [reservations, setReservations] = useState([]);
  const [filteredGeneralReservations, setFilteredGeneralReservations] =
    useState([]);
  const [filteredRecurrentReservations, setFilteredRecurrentReservations] =
    useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [blinkAnim] = useState(new Animated.Value(1));

  // Animação de piscar
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.4,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [blinkAnim]);

  // Carregar reservas em tempo real
  useEffect(() => {
    const loadReservations = async () => {
      try {
        setIsLoading(true);
        await ensureAuthenticated();
        await checkAndMoveExpiredReservations();
        const reservationsRef = ref(database, 'reservations');
        onValue(reservationsRef, (snapshot) => {
          const data = snapshot.val();
          const reservationsList = data
            ? Object.values(data).map((res) => ({
                ...res,
                key: res.id,
              }))
            : [];
          setReservations(reservationsList);
          setFilteredGeneralReservations(
            reservationsList.filter((res) => !res.isRecurrent)
          );
          setFilteredRecurrentReservations(
            reservationsList.filter((res) => res.isRecurrent)
          );
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Erro ao carregar reservas:', error);
        Alert.alert('Erro', 'Falha ao carregar reservas. Tente novamente.');
        setIsLoading(false);
      }
    };

    loadReservations();
  }, []);

  // Filtrar reservas por nome
  useEffect(() => {
    const filteredGeneral = reservations
      .filter((reservation) => !reservation.isRecurrent)
      .filter((reservation) =>
        reservation.clientName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const filteredRecurrent = reservations
      .filter((reservation) => reservation.isRecurrent)
      .filter((reservation) =>
        reservation.clientName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    setFilteredGeneralReservations(filteredGeneral);
    setFilteredRecurrentReservations(filteredRecurrent);
  }, [searchQuery, reservations]);

  // Abrir modal de detalhes
  const handleShowDetails = (reservation) => {
    setSelectedReservation({ reservation });
    setShowDetailsModal(true);
  };

  // Renovar reserva recorrente
  const handleRenew = async (reservation) => {
    try {
      setIsLoading(true);
      const startParsed = parseISO(reservation.startDate);
      const nextMonth = addMonths(startParsed, 1);
      const monthEnd = endOfMonth(nextMonth);
      const dayOfWeek = getDay(startParsed);
      const recurrentDates = eachWeekOfInterval({
        start: nextMonth,
        end: monthEnd,
      })
        .filter((date) => getDay(date) === dayOfWeek)
        .map((date) => format(date, 'yyyy-MM-dd'));

      const newReservations = recurrentDates.map((date) => ({
        ...reservation,
        startDate: date,
        endDate: date,
        isRecurrent: true,
        createdAt: new Date().toISOString(),
      }));

      await createReservation(newReservations);
      Alert.alert('Sucesso', 'Reserva renovada para o próximo mês!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao renovar reserva: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar item da lista
  const renderReservationItem = ({ item }) => {
    const isExpiring = isSameDay(
      parseISO(item.endDate),
      addDays(new Date(), 1)
    );
    return (
      <Animated.View
        style={[styles.reservationCard, isExpiring && { opacity: blinkAnim }]}
      >
        <Text style={styles.clientName}>{item.clientName}</Text>
        <Text style={styles.dates}>
          {item.startDate} {item.startTime}-{item.endTime}
        </Text>
        <Text style={styles.financial}>
          Pago: R$ {item.paidAmount} | Restante: R$ {item.remainingAmount}
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.detailsButton]}
            onPress={() => handleShowDetails(item)}
          >
            <Text style={styles.buttonText}>Detalhes</Text>
          </TouchableOpacity>
          {isExpiring && item.isRecurrent && (
            <TouchableOpacity
              style={[styles.button, styles.renewButton]}
              onPress={() => handleRenew(item)}
            >
              <Text style={styles.buttonText}>Renovar</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
      <Text style={styles.title}>Reservas em Andamento</Text>
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar por nome do cliente"
        placeholderTextColor={COLORS.closed}
      />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reservas Geral</Text>
        {filteredGeneralReservations.length === 0 ? (
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Nenhum resultado encontrado.'
              : 'Nenhuma reserva geral encontrada.'}
          </Text>
        ) : (
          <FlatList
            data={filteredGeneralReservations}
            renderItem={renderReservationItem}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reservas Recorrente</Text>
        {filteredRecurrentReservations.length === 0 ? (
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Nenhum resultado encontrado.'
              : 'Nenhuma reserva recorrente encontrada.'}
          </Text>
        ) : (
          <FlatList
            data={filteredRecurrentReservations}
            renderItem={renderReservationItem}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
      <Modal
        isVisible={showDetailsModal}
        onBackdropPress={() => setShowDetailsModal(false)}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <DetailsModal
          details={selectedReservation}
          onClose={() => setShowDetailsModal(false)}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: COLORS.available,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 15,
  },
  card: {
    backgroundColor: COLORS.available,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 10,
  },
  list: {
    paddingBottom: 10,
  },
  reservationCard: {
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  dates: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 5,
  },
  financial: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  detailsButton: {
    backgroundColor: COLORS.primary,
  },
  renewButton: {
    backgroundColor: COLORS.occupied,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
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
});

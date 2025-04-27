import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Modal from 'react-native-modal';
import { onValue, ref } from 'firebase/database';
import {
  database,
  ensureAuthenticated,
  checkAndMoveExpiredReservations,
} from '../services/firebase';
import DetailsModal from '../components/DetailsModal';
import { COLORS } from '../constants/colors';

export default function ReservationsScreen() {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
            ? Object.keys(data).map((key) => ({
                ...data[key],
                key: data[key].id,
              }))
            : [];
          setReservations(reservationsList);
          setFilteredReservations(reservationsList);
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
    const filtered = reservations.filter((reservation) =>
      reservation.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredReservations(filtered);
  }, [searchQuery, reservations]);

  // Abrir modal de detalhes
  const handleShowDetails = (reservation) => {
    setSelectedReservation({ reservation });
    setShowDetailsModal(true);
  };

  // Renderizar item da lista
  const renderReservationItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleShowDetails(item)}>
      <View style={styles.reservationCard}>
        <Text style={styles.clientName}>{item.clientName}</Text>
        <Text style={styles.dates}>
          {item.startDate} a {item.endDate}
        </Text>
        <Text style={styles.financial}>
          Pago: R$ {item.paidAmount} | Restante: R$ {item.remainingAmount}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
        placeholderTextColor={COLORS.text}
      />
      {filteredReservations.length === 0 && !isLoading ? (
        <Text style={styles.emptyText}>
          {searchQuery
            ? 'Nenhum resultado encontrado.'
            : 'Nenhuma reserva em andamento encontrada.'}
        </Text>
      ) : (
        <FlatList
          data={filteredReservations}
          renderItem={renderReservationItem}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
        />
      )}
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
  emptyText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 20,
  },
  list: {
    paddingBottom: 20,
  },
  reservationCard: {
    backgroundColor: COLORS.available,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
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

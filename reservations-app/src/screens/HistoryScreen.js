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
  deleteHistoryReservation,
} from '../services/firebase';
import DetailsModal from '../components/DetailsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { COLORS } from '../constants/colors';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Carregar histórico em tempo real
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        await ensureAuthenticated();
        const historyRef = ref(database, 'history');
        onValue(historyRef, (snapshot) => {
          const data = snapshot.val();
          const historyList = data
            ? Object.keys(data).map((key) => ({
                ...data[key],
                key: data[key].id,
              }))
            : [];
          console.log(`Histórico carregado: ${historyList.length} reservas`);
          setHistory(historyList);
          setFilteredHistory(historyList);
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        Alert.alert('Erro', 'Falha ao carregar histórico. Tente novamente.');
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  // Filtrar histórico por nome
  useEffect(() => {
    const filtered = history.filter((reservation) =>
      reservation.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredHistory(filtered);
  }, [searchQuery, history]);

  // Abrir modal de detalhes
  const handleShowDetails = (reservation) => {
    setSelectedReservation({ reservation });
    setShowDetailsModal(true);
  };

  // Abrir modal de exclusão
  const handleDelete = (reservation) => {
    setSelectedReservation(reservation);
    setShowDeleteModal(true);
  };

  // Confirmar exclusão
  const handleConfirmDelete = async () => {
    try {
      setIsLoading(true);
      await deleteHistoryReservation(selectedReservation.id);
      Alert.alert('Sucesso', 'Reserva excluída do histórico com sucesso!');
      setShowDeleteModal(false);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao excluir reserva: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar item da lista
  const renderHistoryItem = ({ item }) => (
    <View style={styles.reservationCard}>
      <Text style={styles.clientName}>{item.clientName}</Text>
      <Text style={styles.dates}>
        {item.startDate} a {item.endDate}
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
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.buttonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
      <Text style={styles.title}>Histórico de Reservas</Text>
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar por nome do cliente"
        placeholderTextColor={COLORS.closed}
      />
      {filteredHistory.length === 0 && !isLoading ? (
        <Text style={styles.emptyText}>
          {searchQuery
            ? 'Nenhum resultado encontrado.'
            : 'Nenhuma reserva concluída encontrada.'}
        </Text>
      ) : (
        <FlatList
          data={filteredHistory}
          renderItem={renderHistoryItem}
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
      <Modal
        isVisible={showDeleteModal}
        onBackdropPress={() => setShowDeleteModal(false)}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <ConfirmationModal
          message="Tem certeza que deseja excluir esta reserva do histórico?"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
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
  deleteButton: {
    backgroundColor: COLORS.closed,
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

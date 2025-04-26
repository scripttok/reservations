import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
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
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Carregar histórico em tempo real
  useEffect(() => {
    const loadHistory = async () => {
      try {
        await ensureAuthenticated();
        const historyRef = ref(database, 'history');
        onValue(historyRef, (snapshot) => {
          const data = snapshot.val();
          const historyList = data
            ? Object.keys(data).map((key) => ({
                ...data[key],
                key: data[key].id, // Usar id como key para unicidade
              }))
            : [];
          console.log(`Histórico carregado: ${historyList.length} reservas`);
          setHistory(historyList);
        });
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    };

    loadHistory();
  }, []);

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
      await deleteHistoryReservation(selectedReservation.id);
      alert('Reserva excluída do histórico com sucesso!');
      setShowDeleteModal(false);
    } catch (error) {
      alert('Erro ao excluir reserva: ' + error.message);
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
      <Text style={styles.title}>Histórico de Reservas</Text>
      {history.length === 0 ? (
        <Text style={styles.emptyText}>
          Nenhuma reserva concluída encontrada.
        </Text>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
        />
      )}
      <Modal
        isVisible={showDetailsModal}
        onBackdropPress={() => setShowDetailsModal(false)}
      >
        <DetailsModal
          details={selectedReservation}
          onClose={() => setShowDetailsModal(false)}
        />
      </Modal>
      <Modal
        isVisible={showDeleteModal}
        onBackdropPress={() => setShowDeleteModal(false)}
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
    color: COLORS.text,
    marginBottom: 20,
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
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
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
    padding: 10,
    borderRadius: 5,
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
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

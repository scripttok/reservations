import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../constants/colors';

export default function DetailsModal({ details, onClose }) {
  if (!details) return null;

  const { reservation, reason } = details;

  return (
    <View style={styles.modalContainer}>
      <ScrollView contentContainerStyle={styles.modalContent}>
        <Text style={styles.modalTitle}>
          {reservation ? 'Detalhes da Reserva' : 'Dia Fechado'}
        </Text>
        {reservation ? (
          <>
            <Text style={styles.label}>Cliente:</Text>
            <Text style={styles.value}>{reservation.clientName}</Text>
            <Text style={styles.label}>Período:</Text>
            <Text style={styles.value}>
              {reservation.startDate} a {reservation.endDate}
            </Text>
            <Text style={styles.label}>Valor Pago:</Text>
            <Text style={styles.value}>R$ {reservation.paidAmount}</Text>
            <Text style={styles.label}>Valor Restante:</Text>
            <Text style={styles.value}>R$ {reservation.remainingAmount}</Text>
            <Text style={styles.label}>Observação:</Text>
            <Text style={styles.value}>{reservation.notes || 'Nenhuma'}</Text>
          </>
        ) : (
          <>
            <Text style={styles.label}>Motivo:</Text>
            <Text style={styles.value}>{reason}</Text>
          </>
        )}
        <View style={styles.buttonContainer}>
          <Button title="Fechar" onPress={onClose} color={COLORS.primary} />
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
  },
  value: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 5,
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});

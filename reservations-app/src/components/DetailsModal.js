import { View, Text, Button, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function DetailsModal({ details, onClose }) {
  if (!details) return null;

  const isOccupied = details.reservation;
  const title = isOccupied ? 'Reserva' : 'Dia Fechado';
  const content = isOccupied ? (
    <>
      <Text style={styles.label}>Cliente:</Text>
      <Text style={styles.text}>{details.reservation.clientName}</Text>
      <Text style={styles.label}>Datas:</Text>
      <Text style={styles.text}>
        {details.reservation.startDate} a {details.reservation.endDate}
      </Text>
      <Text style={styles.label}>Valor Pago:</Text>
      <Text style={styles.text}>R$ {details.reservation.paidAmount}</Text>
      <Text style={styles.label}>Valor Restante:</Text>
      <Text style={styles.text}>R$ {details.reservation.remainingAmount}</Text>
      <Text style={styles.label}>Observação:</Text>
      <Text style={styles.text}>{details.reservation.notes || 'Nenhuma'}</Text>
    </>
  ) : (
    <>
      <Text style={styles.label}>Motivo:</Text>
      <Text style={styles.text}>{details.reason}</Text>
    </>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {content}
      <Button title="Fechar" onPress={onClose} color={COLORS.primary} />
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
  text: {
    fontSize: 16,
    color: COLORS.text,
  },
});

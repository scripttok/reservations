import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../constants/colors';

export default function ConfirmationModal({ message, onConfirm, onCancel }) {
  return (
    <View style={styles.modalContainer}>
      <ScrollView contentContainerStyle={styles.modalContent}>
        <Text style={styles.modalTitle}>Confirmação</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.buttonContainer}>
          <Button
            title="Confirmar"
            onPress={onConfirm}
            color={COLORS.primary}
          />
          <Button title="Cancelar" onPress={onCancel} color={COLORS.closed} />
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
  message: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

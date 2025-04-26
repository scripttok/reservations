import { View, Text, Button, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function ConfirmationModal({ message, onConfirm, onCancel }) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.buttonContainer}>
        <Button title="Confirmar" onPress={onConfirm} color={COLORS.primary} />
        <Button title="Cancelar" onPress={onCancel} color={COLORS.closed} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.available,
    padding: 20,
    borderRadius: 10,
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

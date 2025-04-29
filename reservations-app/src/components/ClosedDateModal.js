import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../constants/colors';

const ClosedDateModal = ({
  selectedDate,
  reason,
  onSave,
  onRemove,
  onClose,
}) => {
  const [inputReason, setInputReason] = useState(reason || '');

  const handleSave = () => {
    if (selectedDate && inputReason.trim()) {
      onSave(selectedDate, inputReason.trim());
    } else {
      alert('Por favor, forneça um motivo para o fechamento.');
    }
  };

  const handleRemove = () => {
    if (selectedDate) {
      onRemove(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {reason ? 'Dia Fechado' : 'Adicionar Dia Fechado'}
      </Text>
      {reason ? (
        <>
          <Text style={styles.message}>
            O dia {selectedDate} está fechado pelo seguinte motivo:
          </Text>
          <Text style={styles.reason}>{reason}</Text>
        </>
      ) : (
        <>
          <Text style={styles.message}>Motivo do fechamento:</Text>
          <TextInput
            style={styles.input}
            value={inputReason}
            onChangeText={setInputReason}
            placeholder="Ex.: Limpeza no espaço"
            placeholderTextColor={COLORS.text || '#999'}
          />
        </>
      )}
      <View style={styles.buttonContainer}>
        {reason ? (
          <>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemove}
            >
              <Text style={styles.buttonText}>Remover Dia Fechado</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.buttonText}>Fechar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.buttonText}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background || '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary || '#000',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: COLORS.text || '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  reason: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error || '#ff0000',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.primary || '#000',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    color: COLORS.text || '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  saveButton: {
    backgroundColor: COLORS.primary || '#000',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.error || '#ff0000',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: COLORS.primary || '#000',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: COLORS.error || '#ff0000',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ClosedDateModal;

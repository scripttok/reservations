import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import {
  ensureAuthenticated,
  checkAndMoveExpiredReservations,
} from './src/services/firebase';

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await ensureAuthenticated();
        await checkAndMoveExpiredReservations();
      } catch (error) {
        console.error('Erro ao inicializar app:', error);
      }
    };
    initializeApp();
  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

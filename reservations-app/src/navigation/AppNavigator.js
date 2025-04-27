import { createDrawerNavigator } from '@react-navigation/drawer';
import ReservationsScreen from '../screens/ReservationsScreen';
import CreateReservationScreen from '../screens/CreateReservationScreen';
import HistoryScreen from '../screens/HistoryScreen';
import { COLORS } from '../constants/colors';

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Reservas"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background, // Preto
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        },
        headerTintColor: COLORS.primary, // Amarelo
        headerTitleStyle: {
          fontWeight: 'bold',
          color: COLORS.primary, // Amarelo
        },
        drawerStyle: {
          backgroundColor: COLORS.background, // Preto
          width: 250,
        },
        drawerActiveTintColor: COLORS.primary, // Amarelo
        drawerInactiveTintColor: COLORS.text, // Branco
        drawerActiveBackgroundColor: COLORS.available, // Cinza escuro
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '600',
        },
      }}
    >
      <Drawer.Screen
        name="Reservas"
        component={ReservationsScreen}
        options={{ title: 'Reservas' }}
      />
      <Drawer.Screen
        name="CriarReserva"
        component={CreateReservationScreen}
        options={{ title: 'Criar Reserva' }}
      />
      <Drawer.Screen
        name="Historico"
        component={HistoryScreen}
        options={{ title: 'Histórico' }}
      />
    </Drawer.Navigator>
  );
}

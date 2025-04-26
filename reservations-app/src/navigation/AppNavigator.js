import { createDrawerNavigator } from '@react-navigation/drawer';
import ReservationsScreen from '../screens/ReservationsScreen';
import CreateReservationScreen from '../screens/CreateReservationScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
  return (
    <Drawer.Navigator initialRouteName="Reservas">
      <Drawer.Screen
        name="Reservas"
        component={ReservationsScreen}
        options={{ title: 'Reservas em Andamento' }}
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

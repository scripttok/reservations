import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  push,
  set,
  get,
  update,
  remove,
  onValue,
} from 'firebase/database';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  format,
  parseISO,
  eachDayOfInterval,
  isBefore,
  startOfDay,
} from 'date-fns';
import uuid from 'react-native-uuid';

const firebaseConfig = {
  apiKey: 'AIzaSyAdUHdWZL5InVbtNf_FoR1OX2S-AEg8xHU',
  authDomain: 'reservations-app-5fff1firebaseapp.com',
  databaseURL: 'https://reservations-app-5fff1-default-rtdb.firebaseio.com',
  projectId: 'reservations-app-5fff1',
  storageBucket: 'reservations-app-5fff1.firebasestorage.app',
  messagingSenderId: '902727772919',
  appId: '1:902727772919:android:0cc5c868a57e02572c81f2',
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Função para autenticação anônima
async function ensureAuthenticated() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user);
      } else {
        signInAnonymously(auth)
          .then((result) => resolve(result.user))
          .catch((error) => reject(error));
      }
    });
  });
}

// Função para verificar se um dia está ocupado
async function isDateOccupied(startDate, endDate) {
  await ensureAuthenticated();
  const reservationsRef = ref(database, 'reservations');
  const snapshot = await get(reservationsRef);
  if (snapshot.exists()) {
    const reservations = snapshot.val();
    const targetDays = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate),
    }).map((day) => format(day, 'yyyy-MM-dd'));

    for (const resId in reservations) {
      const res = reservations[resId];
      const resDays = eachDayOfInterval({
        start: parseISO(res.startDate),
        end: parseISO(res.endDate),
      }).map((day) => format(day, 'yyyy-MM-dd'));

      if (targetDays.some((day) => resDays.includes(day))) {
        return true;
      }
    }
  }
  return false;
}

// Criar uma nova reserva
async function createReservation(reservation) {
  await ensureAuthenticated();
  const { startDate, endDate } = reservation;
  const isOccupied = await isDateOccupied(startDate, endDate);
  if (isOccupied) {
    throw new Error('Um ou mais dias já estão ocupados.');
  }

  const reservationsRef = ref(database, 'reservations');
  const newReservationRef = push(reservationsRef);
  const reservationId = uuid.v4();
  const newReservation = {
    id: reservationId,
    ...reservation,
    createdAt: new Date().toISOString(),
  };

  await set(newReservationRef, newReservation);
  console.log(`Nova reserva criada: ${reservationId}`);
  return newReservation;
}

// Listar todas as reservas
async function getReservations() {
  await ensureAuthenticated();
  const reservationsRef = ref(database, 'reservations');
  const snapshot = await get(reservationsRef);
  const reservations = [];
  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      reservations.push(childSnapshot.val());
    });
  }
  return reservations;
}

// Atualizar uma reserva
async function updateReservation(reservationId, updates) {
  await ensureAuthenticated();
  const reservationRef = ref(database, `reservations/${reservationId}`);
  await update(reservationRef, updates);
  console.log(`Reserva atualizada: ${reservationId}`);
}

// Remover uma reserva
async function deleteReservation(reservationKey) {
  await ensureAuthenticated();
  const reservationRef = ref(database, `reservations/${reservationKey}`);
  await remove(reservationRef);
  console.log(`Reserva removida de reservations: ${reservationKey}`);
}

// Mover reserva para o histórico
async function moveToHistory(reservation, reservationKey) {
  await ensureAuthenticated();
  const historyRef = ref(database, `history/${reservation.id}`);
  const historySnapshot = await get(historyRef);

  console.log(
    `Tentando mover reserva ${reservation.id} (key: ${reservationKey}) para histórico`
  );

  // Verificar se a reserva já existe no histórico
  if (historySnapshot.exists()) {
    console.log(
      `Reserva ${reservation.id} já existe no histórico, pulando movimentação`
    );
    return;
  }

  // Salvar no histórico
  await set(historyRef, reservation);
  console.log(`Reserva ${reservation.id} movida para histórico`);

  // Remover da reservations
  await deleteReservation(reservationKey);
}

// Listar reservas do histórico
async function getHistory() {
  await ensureAuthenticated();
  const historyRef = ref(database, 'history');
  const snapshot = await get(historyRef);
  const history = [];
  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      history.push(childSnapshot.val());
    });
  }
  return history;
}

// Adicionar um dia fechado
async function addClosedDate(date, reason) {
  await ensureAuthenticated();
  const closedDateRef = ref(database, `closedDates/${date}`);
  await set(closedDateRef, { reason });
  console.log(`Dia fechado adicionado: ${date}`);
}

// Listar dias fechados
async function getClosedDates() {
  await ensureAuthenticated();
  const closedDatesRef = ref(database, 'closedDates');
  const snapshot = await get(closedDatesRef);
  const closedDates = {};
  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      closedDates[childSnapshot.key] = childSnapshot.val();
    });
  }
  return closedDates;
}

// Verificar e mover reservas expiradas
async function checkAndMoveExpiredReservations() {
  await ensureAuthenticated();
  const reservationsRef = ref(database, 'reservations');
  const historyRef = ref(database, 'history');
  const snapshot = await get(reservationsRef);
  const historySnapshot = await get(historyRef);
  const historyIds = historySnapshot.exists()
    ? Object.keys(historySnapshot.val())
    : [];
  const today = startOfDay(new Date());

  console.log(`Verificando reservas expiradas em ${today.toISOString()}`);

  if (snapshot.exists()) {
    const reservations = snapshot.val();
    for (const key in reservations) {
      const reservation = reservations[key];
      console.log(
        `Analisando reserva ${reservation.id} (key: ${key}), endDate: ${reservation.endDate}`
      );

      if (!historyIds.includes(reservation.id)) {
        const endDate = parseISO(reservation.endDate);
        if (isBefore(endDate, today)) {
          console.log(
            `Reserva ${reservation.id} expirada, movendo para histórico`
          );
          await moveToHistory(reservation, key);
        } else {
          console.log(
            `Reserva ${reservation.id} não expirada, mantendo em reservations`
          );
        }
      } else {
        console.log(`Reserva ${reservation.id} já está no histórico, pulando`);
      }
    }
  } else {
    console.log('Nenhuma reserva encontrada em reservations');
  }
}

// Remover uma reserva do histórico
async function deleteHistoryReservation(reservationId) {
  await ensureAuthenticated();
  const historyRef = ref(database, `history/${reservationId}`);
  await remove(historyRef);
  console.log(`Reserva removida do histórico: ${reservationId}`);
}

export {
  database,
  auth,
  ensureAuthenticated,
  createReservation,
  getReservations,
  updateReservation,
  deleteReservation,
  moveToHistory,
  getHistory,
  addClosedDate,
  getClosedDates,
  isDateOccupied,
  checkAndMoveExpiredReservations,
  deleteHistoryReservation,
};

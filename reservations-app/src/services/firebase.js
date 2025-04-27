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
  isValid,
} from 'date-fns';
import uuid from 'react-native-uuid';

const firebaseConfig = {
  apiKey: 'AIzaSyAdUHdWZL5InVbtNf_FoR1OX2S-AEg8xHU',
  authDomain: 'reservations-app-5fff1.firebaseapp.com',
  databaseURL: 'https://reservations-app-5fff1-default-rtdb.firebaseio.com',
  projectId: 'reservations-app-5fff1',
  storageBucket: 'reservations-app-5fff1.appspot.com',
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
  console.log('Iniciando autenticação anônima...');
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('Usuário autenticado:', user.uid);
        resolve(user);
      } else {
        console.log('Nenhum usuário autenticado, tentando login anônimo...');
        signInAnonymously(auth)
          .then((result) => {
            console.log('Login anônimo bem-sucedido:', result.user.uid);
            resolve(result.user);
          })
          .catch((error) => {
            console.error('Erro na autenticação anônima:', error);
            reject(error);
          });
      }
    });
  });
}

// Validar formato de data
const isValidDateString = (dateStr) => {
  try {
    const parsed = parseISO(dateStr);
    return isValid(parsed) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
  } catch {
    return false;
  }
};

// Função para verificar se um dia está ocupado
async function isDateOccupied(startDate, endDate) {
  console.log('Verificando ocupação de datas:', { startDate, endDate });
  try {
    if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
      console.warn('Datas inválidas fornecidas:', { startDate, endDate });
      throw new Error('Datas inválidas fornecidas.');
    }
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
        if (
          !res.startDate ||
          !res.endDate ||
          !isValidDateString(res.startDate) ||
          !isValidDateString(res.endDate)
        ) {
          console.warn('Reserva com datas inválidas ignorada:', res);
          continue;
        }
        try {
          const resDays = eachDayOfInterval({
            start: parseISO(res.startDate),
            end: parseISO(res.endDate),
          }).map((day) => format(day, 'yyyy-MM-dd'));

          if (targetDays.some((day) => resDays.includes(day))) {
            console.log('Conflito de data detectado:', {
              startDate,
              endDate,
              conflictingReservation: res,
            });
            return true;
          }
        } catch (error) {
          console.error('Erro ao verificar reserva:', res, error);
        }
      }
    }
    console.log('Nenhum conflito de data encontrado.');
    return false;
  } catch (error) {
    console.error('Erro em isDateOccupied:', error);
    throw error;
  }
}

// Função para verificar conflitos de horário
async function hasTimeConflict(startDate, startTime, endTime) {
  console.log('Verificando conflito de horário:', {
    startDate,
    startTime,
    endTime,
  });
  try {
    if (
      !isValidDateString(startDate) ||
      !startTime.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    ) {
      console.warn('Data ou horário inválidos:', { startDate, startTime });
      throw new Error('Data ou horário inválidos.');
    }
    await ensureAuthenticated();
    const reservationsRef = ref(database, 'reservations');
    const snapshot = await get(reservationsRef);
    if (snapshot.exists()) {
      const reservations = snapshot.val();
      for (const resId in reservations) {
        const res = reservations[resId];
        if (
          !res.startDate ||
          !res.startTime ||
          !isValidDateString(res.startDate)
        ) {
          console.warn('Reserva com startDate ou startTime inválidos:', res);
          continue;
        }
        if (res.startDate === startDate && res.startTime === startTime) {
          console.log('Conflito de horário detectado:', {
            startDate,
            startTime,
            conflictingReservation: res,
          });
          return true;
        }
      }
    }
    console.log('Nenhum conflito de horário encontrado.');
    return false;
  } catch (error) {
    console.error('Erro em hasTimeConflict:', error);
    throw error;
  }
}

// Criar uma ou mais reservas
async function createReservation(reservations) {
  console.log('Iniciando createReservation com:', reservations);
  try {
    await ensureAuthenticated();
    const results = [];

    for (const reservation of Array.isArray(reservations)
      ? reservations
      : [reservations]) {
      console.log('Processando reserva:', reservation);
      const {
        clientName,
        startDate,
        endDate,
        startTime,
        endTime,
        paidAmount,
        remainingAmount,
        isRecurrent,
      } = reservation;

      // Validar campos obrigatórios
      if (
        !clientName ||
        !startDate ||
        !endDate ||
        !startTime ||
        !endTime ||
        paidAmount === undefined ||
        remainingAmount === undefined
      ) {
        console.warn('Reserva com campos obrigatórios faltando:', reservation);
        throw new Error('Campos obrigatórios faltando na reserva.');
      }

      if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
        console.warn('Datas inválidas na reserva:', { startDate, endDate });
        throw new Error('Datas inválidas na reserva.');
      }

      if (
        !startTime.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/) ||
        !endTime.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      ) {
        console.warn('Horários inválidos na reserva:', { startTime, endTime });
        throw new Error('Horários inválidos na reserva.');
      }

      if (isNaN(parseFloat(paidAmount)) || isNaN(parseFloat(remainingAmount))) {
        console.warn('Valores financeiros inválidos:', {
          paidAmount,
          remainingAmount,
        });
        throw new Error('Valores financeiros inválidos.');
      }

      // Verificar conflitos de horário
      const timeConflict = await hasTimeConflict(startDate, startTime, endTime);
      if (timeConflict) {
        throw new Error(`Conflito de horário em ${startDate} às ${startTime}.`);
      }

      // Verificar se o dia está ocupado
      const isOccupied = await isDateOccupied(startDate, endDate);
      if (isOccupied) {
        throw new Error(
          `Um ou mais dias já estão ocupados: ${startDate} a ${endDate}.`
        );
      }

      const reservationsRef = ref(database, 'reservations');
      const newReservationRef = push(reservationsRef);
      const reservationId = uuid.v4();
      const newReservation = {
        id: reservationId,
        clientName,
        startDate,
        endDate,
        startTime,
        endTime,
        paidAmount: parseFloat(paidAmount),
        remainingAmount: parseFloat(remainingAmount),
        notes: reservation.notes || '',
        isRecurrent: !!isRecurrent,
        createdAt: new Date().toISOString(),
      };

      console.log('Salvando reserva no Firebase:', newReservation);
      await set(newReservationRef, newReservation);
      console.log(`Reserva criada com ID: ${reservationId}`);
      results.push(newReservation);
    }

    console.log('Reservas criadas com sucesso:', results);
    return results;
  } catch (error) {
    console.error('Erro em createReservation:', error);
    throw error;
  }
}

// Listar todas as reservas
async function getReservations() {
  console.log('Recuperando reservas...');
  try {
    await ensureAuthenticated();
    const reservationsRef = ref(database, 'reservations');
    const snapshot = await get(reservationsRef);
    const reservations = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const res = childSnapshot.val();
        if (res.id && res.startDate && res.endDate) {
          reservations.push(res);
        } else {
          console.warn('Reserva inválida ignorada:', res);
        }
      });
    }
    console.log('Reservas recuperadas:', reservations.length);
    return reservations;
  } catch (error) {
    console.error('Erro em getReservations:', error);
    throw error;
  }
}

// Atualizar uma reserva
async function updateReservation(reservationId, updates) {
  console.log('Atualizando reserva:', reservationId);
  try {
    await ensureAuthenticated();
    const reservationRef = ref(database, `reservations/${reservationId}`);
    await update(reservationRef, updates);
    console.log(`Reserva atualizada: ${reservationId}`);
  } catch (error) {
    console.error('Erro em updateReservation:', error);
    throw error;
  }
}

// Remover uma reserva
async function deleteReservation(reservationKey) {
  console.log('Removendo reserva:', reservationKey);
  try {
    await ensureAuthenticated();
    const reservationRef = ref(database, `reservations/${reservationKey}`);
    await remove(reservationRef);
    console.log(`Reserva removida de reservations: ${reservationKey}`);
  } catch (error) {
    console.error('Erro em deleteReservation:', error);
    throw error;
  }
}

// Mover reserva para o histórico
async function moveToHistory(reservation, reservationKey) {
  console.log(`Movendo reserva ${reservation.id} para histórico...`);
  try {
    await ensureAuthenticated();
    const historyRef = ref(database, `history/${reservation.id}`);
    const historySnapshot = await get(historyRef);

    if (historySnapshot.exists()) {
      console.log(
        `Reserva ${reservation.id} já existe no histórico, pulando movimentação`
      );
      return;
    }

    await set(historyRef, reservation);
    console.log(`Reserva ${reservation.id} movida para histórico`);
    await deleteReservation(reservationKey);
  } catch (error) {
    console.error('Erro em moveToHistory:', error);
    throw error;
  }
}

// Listar reservas do histórico
async function getHistory() {
  console.log('Recuperando histórico...');
  try {
    await ensureAuthenticated();
    const historyRef = ref(database, 'history');
    const snapshot = await get(historyRef);
    const history = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        history.push(childSnapshot.val());
      });
    }
    console.log('Histórico recuperado:', history.length);
    return history;
  } catch (error) {
    console.error('Erro em getHistory:', error);
    throw error;
  }
}

// Adicionar um dia fechado
async function addClosedDate(date, reason) {
  console.log('Adicionando dia fechado:', { date, reason });
  try {
    await ensureAuthenticated();
    const closedDateRef = ref(database, `closedDates/${date}`);
    await set(closedDateRef, { reason });
    console.log(`Dia fechado adicionado: ${date}`);
  } catch (error) {
    console.error('Erro em addClosedDate:', error);
    throw error;
  }
}

// Listar dias fechados
async function getClosedDates() {
  console.log('Recuperando dias fechados...');
  try {
    await ensureAuthenticated();
    const closedDatesRef = ref(database, 'closedDates');
    const snapshot = await get(closedDatesRef);
    const closedDates = {};
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        closedDates[childSnapshot.key] = childSnapshot.val();
      });
    }
    console.log('Dias fechados recuperados:', Object.keys(closedDates).length);
    return closedDates;
  } catch (error) {
    console.error('Erro em getClosedDates:', error);
    throw error;
  }
}

// Verificar e mover reservas expiradas
async function checkAndMoveExpiredReservations() {
  console.log('Verificando reservas expiradas...');
  try {
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
        if (
          !reservation.startDate ||
          !reservation.endDate ||
          !isValidDateString(reservation.endDate)
        ) {
          console.warn('Reserva com datas inválidas ignorada:', reservation);
          continue;
        }
        console.log(
          `Analisando reserva ${reservation.id} (key: ${key}), endDate: ${reservation.endDate}`
        );

        if (!historyIds.includes(reservation.id)) {
          try {
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
          } catch (error) {
            console.error('Erro ao processar expiração:', reservation, error);
          }
        } else {
          console.log(
            `Reserva ${reservation.id} já está no histórico, pulando`
          );
        }
      }
    } else {
      console.log('Nenhuma reserva encontrada em reservations');
    }
  } catch (error) {
    console.error('Erro em checkAndMoveExpiredReservations:', error);
    throw error;
  }
}

// Remover uma reserva do histórico
async function deleteHistoryReservation(reservationId) {
  console.log('Removendo reserva do histórico:', reservationId);
  try {
    await ensureAuthenticated();
    const historyRef = ref(database, `history/${reservationId}`);
    await remove(historyRef);
    console.log(`Reserva removida do histórico: ${reservationId}`);
  } catch (error) {
    console.error('Erro em deleteHistoryReservation:', error);
    throw error;
  }
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
  hasTimeConflict,
};

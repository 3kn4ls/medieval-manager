import cron from 'node-cron';
import { sendNotificationToAll } from '../controllers/pushController';
import Settings from '../models/Settings';
import Bocadillo from '../models/Bocadillo';
import { getTargetWeek } from '../utils/dateUtils';

let notificationSent = false;
let currentWeek = 0;

const MADRID_TZ = 'Europe/Madrid';
const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/**
 * Devuelve el día de la semana y la hora en zona horaria Europe/Madrid.
 * Necesario porque el servidor Render corre en UTC y `Date#getHours()` /
 * `Date#getDay()` devolverían la hora UTC, no la hora local española.
 */
function getMadridTime(date: Date): { dayOfWeek: number; hours: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: MADRID_TZ,
    weekday: 'short',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const weekdayStr = parts.find(p => p.type === 'weekday')?.value ?? 'Sun';
  const hourStr = parts.find(p => p.type === 'hour')?.value ?? '0';

  return {
    dayOfWeek: WEEKDAY_MAP[weekdayStr] ?? 0,
    hours: parseInt(hourStr, 10),
  };
}

/**
 * Inicializa el scheduler de notificaciones
 * Revisa cada hora si es jueves a las 11:00 hora de Madrid (6 horas antes
 * del cierre) y envía una notificación a todos los usuarios.
 */
export function initNotificationScheduler() {
  // Ejecutar cada hora en el minuto 0 (UTC; la condición de hora la
  // evaluamos manualmente en hora Madrid más abajo).
  cron.schedule('0 * * * *', async () => {
    const now = new Date();
    const { dayOfWeek, hours } = getMadridTime(now);

    // Obtener número de semana objetivo (la del próximo viernes)
    const { week, year } = getTargetWeek(now);
    const weekNumber = getISOWeekNumber(now);

    // Resetear el flag si cambiamos de semana objetivo
    if (weekNumber !== currentWeek) {
      notificationSent = false;
      currentWeek = weekNumber;
    }

    // Si es jueves (4) a las 11:00 y no hemos enviado la notificación esta semana
    if (dayOfWeek === 4 && hours === 11 && !notificationSent) {
      try {
        console.log('Checking if deadline reminder notification should be sent...');

        // Verificar si los pedidos están cerrados
        const settings = await Settings.findOne();
        if (settings?.ordersClosed) {
          console.log('Pedidos cerrados - No se enviarán notificaciones');
          notificationSent = true; // Marcar como enviado para no reintentar
          return;
        }

        // Obtener usuarios que YA tienen bocadillo para esta semana (la del próximo viernes)
        const { week, year } = getTargetWeek(now);
        const bocadillos = await Bocadillo.find({ semana: week, ano: year });
        const usersWithOrder = bocadillos
          .map((b) => b.userId?.toString())
          .filter((id): id is string => !!id);

        console.log(`Found ${usersWithOrder.length} users with orders this week - they will be excluded`);

        // Enviar notificación solo a usuarios sin pedido
        await sendNotificationToAll(
          '⏰ ¡Últimas horas para pedir!',
          'Quedan 6 horas para el cierre de pedidos de bocadillos. ¡No te olvides de hacer tu pedido!',
          {
            url: '/orders',
            tag: 'deadline-reminder',
          },
          usersWithOrder // Excluir usuarios que ya tienen pedido
        );
        notificationSent = true;
        console.log('Deadline reminder notification sent successfully');
      } catch (error) {
        console.error('Error sending deadline reminder notification:', error);
      }
    }
  });

  console.log('Notification scheduler initialized - Will send reminders on Thursdays at 11:00 Europe/Madrid');
}

/**
 * Obtiene el número de semana ISO
 */
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

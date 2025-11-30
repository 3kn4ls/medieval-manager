import { Request, Response, NextFunction } from 'express';
import { isWithinOrderWindow, getNextFriday } from '../utils/dateUtils';
import SystemConfig from '../models/SystemConfig';

export async function checkOrderWindow(req: Request, res: Response, next: NextFunction) {
  try {
    // Verificar si el admin ha cerrado manualmente los pedidos
    const config = await SystemConfig.findOne();

    if (config?.manuallyClosedOrders) {
      return res.status(403).json({
        error: 'Servicio cerrado',
        message: config.closureMessage || 'El servicio de bocadillos está cerrado esta semana. Vuelve a probar la próxima semana.',
        manuallyClosed: true,
      });
    }

    // Verificar la ventana de tiempo automática
    if (!isWithinOrderWindow()) {
      const nextFriday = getNextFriday();
      return res.status(403).json({
        error: 'Fuera de la ventana de pedidos',
        message: 'Los pedidos solo se pueden realizar de viernes a jueves hasta las 17:00',
        nextAvailable: nextFriday.toISOString(),
      });
    }

    next();
  } catch (error) {
    console.error('Error al verificar ventana de pedidos:', error);
    // En caso de error, continuar con la validación por fecha únicamente
    if (!isWithinOrderWindow()) {
      const nextFriday = getNextFriday();
      return res.status(403).json({
        error: 'Fuera de la ventana de pedidos',
        message: 'Los pedidos solo se pueden realizar de viernes a jueves hasta las 17:00',
        nextAvailable: nextFriday.toISOString(),
      });
    }
    next();
  }
}

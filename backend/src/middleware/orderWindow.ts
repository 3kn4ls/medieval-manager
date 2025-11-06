import { Request, Response, NextFunction } from 'express';
import { isWithinOrderWindow, getNextMonday } from '../utils/dateUtils';

export function checkOrderWindow(req: Request, res: Response, next: NextFunction) {
  if (!isWithinOrderWindow()) {
    const nextMonday = getNextMonday();
    return res.status(403).json({
      error: 'Fuera de la ventana de pedidos',
      message: 'Los pedidos solo se pueden realizar de lunes a jueves hasta las 17:00',
      nextAvailable: nextMonday.toISOString(),
    });
  }
  next();
}

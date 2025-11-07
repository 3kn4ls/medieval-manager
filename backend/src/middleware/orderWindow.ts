import { Request, Response, NextFunction } from 'express';
import { isWithinOrderWindow, getNextFriday } from '../utils/dateUtils';

export function checkOrderWindow(req: Request, res: Response, next: NextFunction) {
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

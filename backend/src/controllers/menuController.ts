import { Request, Response } from 'express';
import { INGREDIENTES_DISPONIBLES, BOCATAS_PREDEFINIDOS } from '../config/menu';
import { isWithinOrderWindow, getNextMonday, getThursdayDeadline } from '../utils/dateUtils';

export const getIngredientes = async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: INGREDIENTES_DISPONIBLES,
  });
};

export const getBocatasPredefinidos = async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: BOCATAS_PREDEFINIDOS,
  });
};

export const getOrderWindowStatus = async (req: Request, res: Response) => {
  const isOpen = isWithinOrderWindow();
  const now = new Date();

  res.json({
    success: true,
    data: {
      isOpen,
      currentTime: now.toISOString(),
      deadline: getThursdayDeadline(now).toISOString(),
      nextOpening: isOpen ? null : getNextMonday(now).toISOString(),
      message: isOpen
        ? 'Ventana de pedidos abierta'
        : 'Ventana de pedidos cerrada. Se abrirá el próximo lunes.',
    },
  });
};

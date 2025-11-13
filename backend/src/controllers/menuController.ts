import { Request, Response } from 'express';
import { INGREDIENTES_DISPONIBLES, BOCATAS_PREDEFINIDOS } from '../config/menu';
import { isWithinOrderWindow, getNextMonday, getThursdayDeadline, getWeekNumber } from '../utils/dateUtils';
import BocadilloAlquimista from '../models/BocadilloAlquimista';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../models/User';

export const getIngredientes = async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: INGREDIENTES_DISPONIBLES,
  });
};

export const getBocatasPredefinidos = async (req: Request, res: Response) => {
  try {
    const { week, year } = getWeekNumber(new Date());
    const user = (req as AuthRequest).user;
    const isAdmin = user?.role === UserRole.ADMIN;

    // Buscar si hay un Alquimista para esta semana
    const alquimista = await BocadilloAlquimista.findOne({
      semana: week,
      ano: year,
    });

    let bocatasPredefinidos = [...BOCATAS_PREDEFINIDOS];

    // Si existe el Alquimista, añadirlo a la lista
    if (alquimista) {
      bocatasPredefinidos.push({
        nombre: 'Alquimista',
        tamano: alquimista.tamano,
        tipoPan: alquimista.tipoPan,
        // Solo mostrar ingredientes a los admins, usuarios normales ven array vacío
        ingredientes: isAdmin ? alquimista.ingredientes : [],
      });
    }

    res.json({
      success: true,
      data: bocatasPredefinidos,
    });
  } catch (error) {
    console.error('Error fetching bocatas predefinidos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener bocatas predefinidos',
    });
  }
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

import { Request, Response } from 'express';
import Settings from '../models/Settings';

// Obtener configuración actual
export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();

    // Si no existe configuración, crear una por defecto
    if (!settings) {
      settings = new Settings({
        publicRegistrationEnabled: false,
        ordersClosed: false,
        closedMessage: 'Las solicitudes de bocadillos están cerradas temporalmente',
      });
      await settings.save();
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la configuración',
    });
  }
};

// Actualizar configuración (solo admin)
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { publicRegistrationEnabled, ordersClosed, closedMessage, closedUntilDate } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
    }

    if (publicRegistrationEnabled !== undefined) {
      settings.publicRegistrationEnabled = publicRegistrationEnabled;
    }

    if (ordersClosed !== undefined) {
      settings.ordersClosed = ordersClosed;
    }

    if (closedMessage !== undefined) {
      settings.closedMessage = closedMessage;
    }

    if (closedUntilDate !== undefined) {
      settings.closedUntilDate = closedUntilDate;
    }

    await settings.save();

    res.json({
      success: true,
      data: settings,
      message: 'Configuración actualizada correctamente',
    });
  } catch (error: any) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la configuración',
    });
  }
};

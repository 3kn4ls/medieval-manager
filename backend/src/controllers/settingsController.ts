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
    const { publicRegistrationEnabled } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
    }

    if (publicRegistrationEnabled !== undefined) {
      settings.publicRegistrationEnabled = publicRegistrationEnabled;
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

import { Request, Response } from 'express';
import Bocadillo from '../models/Bocadillo';
import { createBocadilloSchema } from '../validators/bocadilloValidator';
import { getWeekNumber } from '../utils/dateUtils';
import { ZodError } from 'zod';

export const createBocadillo = async (req: Request, res: Response) => {
  try {
    // Validar datos de entrada
    const validatedData = createBocadilloSchema.parse(req.body);

    // Obtener semana actual
    const { week, year } = getWeekNumber(new Date());

    // Crear bocadillo
    const bocadillo = new Bocadillo({
      ...validatedData,
      semana: week,
      ano: year,
    });

    await bocadillo.save();

    res.status(201).json({
      success: true,
      data: bocadillo,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validación fallida',
        details: error.errors,
      });
    }

    console.error('Error creating bocadillo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el bocadillo',
    });
  }
};

export const getBocadillosSemanaActual = async (req: Request, res: Response) => {
  try {
    const { week, year } = getWeekNumber(new Date());

    const bocadillos = await Bocadillo.find({
      semana: week,
      ano: year,
    }).sort({ fechaCreacion: -1 });

    res.json({
      success: true,
      data: bocadillos,
      semana: week,
      ano: year,
    });
  } catch (error) {
    console.error('Error fetching bocadillos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los bocadillos',
    });
  }
};

export const deleteBocadillo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { week, year } = getWeekNumber(new Date());

    // Solo permitir eliminar bocadillos de la semana actual
    const bocadillo = await Bocadillo.findOne({
      _id: id,
      semana: week,
      ano: year,
    });

    if (!bocadillo) {
      return res.status(404).json({
        success: false,
        error: 'Bocadillo no encontrado o no se puede eliminar',
      });
    }

    await Bocadillo.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Bocadillo eliminado correctamente',
    });
  } catch (error) {
    console.error('Error deleting bocadillo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el bocadillo',
    });
  }
};

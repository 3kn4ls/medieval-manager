import { Request, Response } from 'express';
import Bocadillo from '../models/Bocadillo';
import { createBocadilloSchema } from '../validators/bocadilloValidator';
import { getWeekNumber } from '../utils/dateUtils';
import { ZodError } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../models/User';

export const createBocadillo = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
    }

    // Validar datos de entrada
    const validatedData = createBocadilloSchema.parse(req.body);

    // Obtener semana actual
    const { week, year } = getWeekNumber(new Date());

    // Crear bocadillo con el userId y nombre del usuario autenticado
    const bocadillo = new Bocadillo({
      ...validatedData,
      nombre: user.nombre,
      userId: user.userId,
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

export const updateBocadillo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { week, year } = getWeekNumber(new Date());
    const user = (req as AuthRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
    }

    // Buscar el bocadillo
    const bocadillo = await Bocadillo.findOne({
      _id: id,
      semana: week,
      ano: year,
    });

    if (!bocadillo) {
      return res.status(404).json({
        success: false,
        error: 'Bocadillo no encontrado o no se puede editar',
      });
    }

    // Verificar permisos: solo el creador o un admin pueden editar
    const isAdmin = user.role === UserRole.ADMIN;
    const isOwner = bocadillo.userId?.toString() === user.userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para editar este bocadillo',
      });
    }

    // Validar los datos de entrada
    const validatedData = createBocadilloSchema.parse(req.body);

    // Actualizar el bocadillo manteniendo la semana, año y nombre original
    bocadillo.tamano = validatedData.tamano;
    bocadillo.tipoPan = validatedData.tipoPan;
    bocadillo.ingredientes = validatedData.ingredientes;
    bocadillo.bocataPredefinido = validatedData.bocataPredefinido;

    await bocadillo.save();

    res.json({
      success: true,
      data: bocadillo,
      message: 'Bocadillo actualizado correctamente',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validación fallida',
        details: error.errors,
      });
    }

    console.error('Error updating bocadillo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el bocadillo',
    });
  }
};

export const deleteBocadillo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { week, year } = getWeekNumber(new Date());
    const user = (req as AuthRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
    }

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

    // Verificar permisos: solo el creador o un admin pueden eliminar
    const isAdmin = user.role === UserRole.ADMIN;
    const isOwner = bocadillo.userId?.toString() === user.userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para eliminar este bocadillo',
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

// Actualizar precio de un bocadillo (solo admin)
export const updatePrecio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { precio } = req.body;

    if (precio === undefined || precio < 0) {
      return res.status(400).json({
        success: false,
        error: 'Precio inválido',
      });
    }

    const bocadillo = await Bocadillo.findById(id);

    if (!bocadillo) {
      return res.status(404).json({
        success: false,
        error: 'Bocadillo no encontrado',
      });
    }

    bocadillo.precio = precio;
    await bocadillo.save();

    res.json({
      success: true,
      data: bocadillo,
      message: 'Precio actualizado correctamente',
    });
  } catch (error) {
    console.error('Error updating precio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el precio',
    });
  }
};

// Marcar bocadillo como pagado (solo admin)
export const markAsPagado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pagado } = req.body;

    const bocadillo = await Bocadillo.findById(id);

    if (!bocadillo) {
      return res.status(404).json({
        success: false,
        error: 'Bocadillo no encontrado',
      });
    }

    if (!bocadillo.precio) {
      return res.status(400).json({
        success: false,
        error: 'No se puede marcar como pagado sin precio',
      });
    }

    bocadillo.pagado = pagado;
    await bocadillo.save();

    res.json({
      success: true,
      data: bocadillo,
      message: pagado ? 'Marcado como pagado' : 'Marcado como no pagado',
    });
  } catch (error) {
    console.error('Error updating pagado status:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el estado de pago',
    });
  }
};

import { Request, Response } from 'express';
import Bocadillo from '../models/Bocadillo';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// Obtener el último bocadillo del usuario autenticado
export const getUltimoBocadilloUsuario = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
    }

    const ultimoBocadillo = await Bocadillo.findOne({
      userId: user.userId,
    }).sort({ fechaCreacion: -1 });

    res.json({
      success: true,
      data: ultimoBocadillo,
    });
  } catch (error) {
    console.error('Error fetching último bocadillo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el último bocadillo',
    });
  }
};

// Obtener bocadillos más pedidos globalmente (top ingredientes y configuraciones)
export const getBocadillosMasPedidosGlobal = async (req: Request, res: Response) => {
  try {
    // Top ingredientes más usados
    const topIngredientes = await Bocadillo.aggregate([
      { $unwind: '$ingredientes' },
      {
        $group: {
          _id: '$ingredientes',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          ingrediente: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Top bocatas predefinidas más pedidas
    const topBocatasPredefinidas = await Bocadillo.aggregate([
      { $match: { bocataPredefinido: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$bocataPredefinido',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          bocata: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Distribución por tamaño
    const distribucionTamano = await Bocadillo.aggregate([
      {
        $group: {
          _id: '$tamano',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          tamano: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Distribución por tipo de pan
    const distribucionPan = await Bocadillo.aggregate([
      {
        $group: {
          _id: '$tipoPan',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          tipoPan: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        topIngredientes,
        topBocatasPredefinidas,
        distribucionTamano,
        distribucionPan,
      },
    });
  } catch (error) {
    console.error('Error fetching estadísticas globales:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas globales',
    });
  }
};

// Obtener bocadillos más pedidos por el usuario autenticado
export const getBocadillosMasPedidosUsuario = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
    }

    // Top ingredientes más usados por el usuario
    const topIngredientes = await Bocadillo.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(user.userId) } },
      { $unwind: '$ingredientes' },
      {
        $group: {
          _id: '$ingredientes',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          ingrediente: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Top bocatas predefinidas más pedidas por el usuario
    const topBocatasPredefinidas = await Bocadillo.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(user.userId),
          bocataPredefinido: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$bocataPredefinido',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          bocata: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Distribución por tamaño del usuario
    const distribucionTamano = await Bocadillo.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(user.userId) } },
      {
        $group: {
          _id: '$tamano',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          tamano: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Distribución por tipo de pan del usuario
    const distribucionPan = await Bocadillo.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(user.userId) } },
      {
        $group: {
          _id: '$tipoPan',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          tipoPan: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Total de bocadillos pedidos por el usuario
    const totalBocadillos = await Bocadillo.countDocuments({
      userId: user.userId,
    });

    res.json({
      success: true,
      data: {
        totalBocadillos,
        topIngredientes,
        topBocatasPredefinidas,
        distribucionTamano,
        distribucionPan,
      },
    });
  } catch (error) {
    console.error('Error fetching estadísticas de usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas del usuario',
    });
  }
};

// Obtener estadísticas generales
export const getEstadisticasGenerales = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
    }

    // Total de bocadillos en el sistema
    const totalBocadillos = await Bocadillo.countDocuments();

    // Total de bocadillos del usuario
    const totalBocadillosUsuario = await Bocadillo.countDocuments({
      userId: user.userId,
    });

    // Bocadillos esta semana
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Lunes
    startOfWeek.setHours(0, 0, 0, 0);

    const bocadillosSemana = await Bocadillo.countDocuments({
      fechaCreacion: { $gte: startOfWeek },
    });

    // Bocadillos del usuario esta semana
    const bocadillosSemanaUsuario = await Bocadillo.countDocuments({
      userId: user.userId,
      fechaCreacion: { $gte: startOfWeek },
    });

    // Gasto total del usuario (suma de precios)
    const gastoTotal = await Bocadillo.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(user.userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: '$precio' },
        },
      },
    ]);

    const gastoTotalUsuario = gastoTotal.length > 0 ? gastoTotal[0].total : 0;

    // Tendencia semanal (últimas 8 semanas)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const tendenciaSemanal = await Bocadillo.aggregate([
      { $match: { fechaCreacion: { $gte: eightWeeksAgo } } },
      {
        $group: {
          _id: { semana: '$semana', ano: '$ano' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.ano': 1, '_id.semana': 1 } },
      {
        $project: {
          semana: '$_id.semana',
          ano: '$_id.ano',
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalBocadillos,
        totalBocadillosUsuario,
        bocadillosSemana,
        bocadillosSemanaUsuario,
        gastoTotalUsuario,
        tendenciaSemanal,
      },
    });
  } catch (error) {
    console.error('Error fetching estadísticas generales:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas generales',
    });
  }
};

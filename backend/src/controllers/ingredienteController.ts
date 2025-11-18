import { Request, Response } from 'express';
import Ingrediente from '../models/Ingrediente';

// Obtener todos los ingredientes
export const getAllIngredientes = async (req: Request, res: Response) => {
  try {
    const ingredientes = await Ingrediente.find().sort({ orden: 1, nombre: 1 });

    res.json({
      success: true,
      data: ingredientes,
    });
  } catch (error) {
    console.error('Error getting ingredientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los ingredientes',
    });
  }
};

// Obtener ingredientes disponibles (para formulario público)
export const getIngredientesDisponibles = async (req: Request, res: Response) => {
  try {
    const ingredientes = await Ingrediente.find({ disponible: true }).sort({ orden: 1, nombre: 1 });

    res.json({
      success: true,
      data: ingredientes.map(ing => ing.nombre),
    });
  } catch (error) {
    console.error('Error getting ingredientes disponibles:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los ingredientes',
    });
  }
};

// Admin: Crear ingrediente
export const createIngrediente = async (req: Request, res: Response) => {
  try {
    const { nombre, disponible, orden } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'El nombre del ingrediente es requerido',
      });
    }

    // Verificar si ya existe
    const existingIngrediente = await Ingrediente.findOne({
      nombre: nombre.toUpperCase().trim()
    });

    if (existingIngrediente) {
      return res.status(400).json({
        success: false,
        error: 'El ingrediente ya existe',
      });
    }

    const ingrediente = new Ingrediente({
      nombre: nombre.toUpperCase().trim(),
      disponible: disponible !== undefined ? disponible : true,
      orden: orden || 0,
    });

    await ingrediente.save();

    res.status(201).json({
      success: true,
      data: ingrediente,
      message: 'Ingrediente creado correctamente',
    });
  } catch (error) {
    console.error('Error creating ingrediente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el ingrediente',
    });
  }
};

// Admin: Actualizar ingrediente
export const updateIngrediente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, disponible, orden } = req.body;

    const ingrediente = await Ingrediente.findById(id);
    if (!ingrediente) {
      return res.status(404).json({
        success: false,
        error: 'Ingrediente no encontrado',
      });
    }

    // Verificar si el nuevo nombre ya existe (si se está cambiando)
    if (nombre && nombre.toUpperCase().trim() !== ingrediente.nombre) {
      const existingIngrediente = await Ingrediente.findOne({
        nombre: nombre.toUpperCase().trim()
      });

      if (existingIngrediente) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe un ingrediente con ese nombre',
        });
      }

      ingrediente.nombre = nombre.toUpperCase().trim();
    }

    if (disponible !== undefined) {
      ingrediente.disponible = disponible;
    }

    if (orden !== undefined) {
      ingrediente.orden = orden;
    }

    await ingrediente.save();

    res.json({
      success: true,
      data: ingrediente,
      message: 'Ingrediente actualizado correctamente',
    });
  } catch (error) {
    console.error('Error updating ingrediente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el ingrediente',
    });
  }
};

// Admin: Eliminar ingrediente
export const deleteIngrediente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ingrediente = await Ingrediente.findById(id);
    if (!ingrediente) {
      return res.status(404).json({
        success: false,
        error: 'Ingrediente no encontrado',
      });
    }

    await Ingrediente.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Ingrediente eliminado correctamente',
    });
  } catch (error) {
    console.error('Error deleting ingrediente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el ingrediente',
    });
  }
};

// Admin: Inicializar ingredientes por defecto
export const initializeDefaultIngredientes = async (req: Request, res: Response) => {
  try {
    const count = await Ingrediente.countDocuments();

    if (count > 0) {
      return res.json({
        success: true,
        message: 'Ya existen ingredientes en la base de datos',
      });
    }

    const defaultIngredientes = [
      'JAMON YORK',
      'JAMON SERRANO',
      'SALCHICHON',
      'CHORIZO',
      'LOMO',
      'QUESO',
      'ATUN',
      'TORTILLA',
      'BACON',
      'PAVO',
      'LECHUGA',
      'TOMATE',
      'CEBOLLA',
      'PIMIENTOS',
      'ACEITUNAS',
      'MAYONESA',
      'KETCHUP',
      'MOSTAZA',
      'ALIOLI',
    ];

    const ingredientes = defaultIngredientes.map((nombre, index) => ({
      nombre,
      disponible: true,
      orden: index,
    }));

    await Ingrediente.insertMany(ingredientes);

    res.json({
      success: true,
      message: `${ingredientes.length} ingredientes inicializados correctamente`,
    });
  } catch (error) {
    console.error('Error initializing ingredientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al inicializar los ingredientes',
    });
  }
};

import { Request, Response } from 'express';
import Ingrediente from '../models/Ingrediente';
import { createIngredienteSchema, updateIngredienteSchema } from '../validators/ingredienteValidator';
import { ZodError } from 'zod';

/**
 * Obtener todos los ingredientes
 * GET /api/ingredientes
 */
export const getIngredientes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { disponible, categoria } = req.query;

    const filter: any = {};

    // Filtrar por disponibilidad si se especifica
    if (disponible !== undefined) {
      filter.disponible = disponible === 'true';
    }

    // Filtrar por categoría si se especifica
    if (categoria) {
      filter.categoria = categoria;
    }

    const ingredientes = await Ingrediente.find(filter).sort({ orden: 1, nombre: 1 });

    res.json(ingredientes);
  } catch (error) {
    console.error('Error al obtener ingredientes:', error);
    res.status(500).json({ message: 'Error al obtener ingredientes' });
  }
};

/**
 * Obtener un ingrediente por ID
 * GET /api/ingredientes/:id
 */
export const getIngredienteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const ingrediente = await Ingrediente.findById(id);

    if (!ingrediente) {
      res.status(404).json({ message: 'Ingrediente no encontrado' });
      return;
    }

    res.json(ingrediente);
  } catch (error) {
    console.error('Error al obtener ingrediente:', error);
    res.status(500).json({ message: 'Error al obtener ingrediente' });
  }
};

/**
 * Crear un nuevo ingrediente (solo admin)
 * POST /api/ingredientes
 */
export const createIngrediente = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar datos con Zod
    const validatedData = createIngredienteSchema.parse(req.body);

    // Verificar si ya existe un ingrediente con el mismo nombre
    const existingIngrediente = await Ingrediente.findOne({
      nombre: { $regex: new RegExp(`^${validatedData.nombre}$`, 'i') }
    });

    if (existingIngrediente) {
      res.status(400).json({ message: 'Ya existe un ingrediente con ese nombre' });
      return;
    }

    // Crear nuevo ingrediente
    const ingrediente = new Ingrediente(validatedData);
    await ingrediente.save();

    res.status(201).json(ingrediente);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: 'Datos inválidos',
        errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
      return;
    }

    console.error('Error al crear ingrediente:', error);
    res.status(500).json({ message: 'Error al crear ingrediente' });
  }
};

/**
 * Actualizar un ingrediente (solo admin)
 * PUT /api/ingredientes/:id
 */
export const updateIngrediente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validar datos con Zod
    const validatedData = updateIngredienteSchema.parse(req.body);

    // Si se está actualizando el nombre, verificar que no exista otro ingrediente con ese nombre
    if (validatedData.nombre) {
      const existingIngrediente = await Ingrediente.findOne({
        _id: { $ne: id },
        nombre: { $regex: new RegExp(`^${validatedData.nombre}$`, 'i') }
      });

      if (existingIngrediente) {
        res.status(400).json({ message: 'Ya existe otro ingrediente con ese nombre' });
        return;
      }
    }

    // Actualizar ingrediente
    const ingrediente = await Ingrediente.findByIdAndUpdate(
      id,
      validatedData,
      { new: true, runValidators: true }
    );

    if (!ingrediente) {
      res.status(404).json({ message: 'Ingrediente no encontrado' });
      return;
    }

    res.json(ingrediente);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: 'Datos inválidos',
        errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
      return;
    }

    console.error('Error al actualizar ingrediente:', error);
    res.status(500).json({ message: 'Error al actualizar ingrediente' });
  }
};

/**
 * Eliminar un ingrediente (solo admin)
 * DELETE /api/ingredientes/:id
 */
export const deleteIngrediente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const ingrediente = await Ingrediente.findByIdAndDelete(id);

    if (!ingrediente) {
      res.status(404).json({ message: 'Ingrediente no encontrado' });
      return;
    }

    res.json({ message: 'Ingrediente eliminado correctamente', ingrediente });
  } catch (error) {
    console.error('Error al eliminar ingrediente:', error);
    res.status(500).json({ message: 'Error al eliminar ingrediente' });
  }
};

/**
 * Obtener categorías de ingredientes
 * GET /api/ingredientes/categorias/list
 */
export const getCategorias = async (req: Request, res: Response): Promise<void> => {
  try {
    const categorias = await Ingrediente.distinct('categoria');
    res.json(categorias.filter(c => c)); // Filtrar valores nulos o vacíos
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ message: 'Error al obtener categorías' });
  }
};

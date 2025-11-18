import { z } from 'zod';

export const createIngredienteSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre del ingrediente es requerido')
    .max(100, 'El nombre no puede exceder los 100 caracteres')
    .trim(),
  categoria: z.string()
    .max(50, 'La categoría no puede exceder los 50 caracteres')
    .trim()
    .optional(),
  disponible: z.boolean().optional().default(true),
  orden: z.number().int().optional().default(0),
});

export const updateIngredienteSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre del ingrediente es requerido')
    .max(100, 'El nombre no puede exceder los 100 caracteres')
    .trim()
    .optional(),
  categoria: z.string()
    .max(50, 'La categoría no puede exceder los 50 caracteres')
    .trim()
    .optional(),
  disponible: z.boolean().optional(),
  orden: z.number().int().optional(),
});

export type CreateIngredienteInput = z.infer<typeof createIngredienteSchema>;
export type UpdateIngredienteInput = z.infer<typeof updateIngredienteSchema>;

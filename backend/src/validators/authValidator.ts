import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3, 'El username debe tener al menos 3 caracteres').toLowerCase(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(1, 'El nombre es requerido').toUpperCase(),
});

export const loginSchema = z.object({
  username: z.string().toLowerCase(),
  password: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

import { z } from 'zod';
import { TamanoBocadillo, TipoPan } from '../models/Bocadillo';

export const createBocadilloSchema = z
  .object({
    nombre: z
      .string()
      .min(1, 'El nombre es obligatorio')
      .max(50, 'El nombre es demasiado largo')
      .transform((val) => val.toUpperCase()),
    tamano: z.nativeEnum(TamanoBocadillo, {
      errorMap: () => ({ message: 'Tamaño inválido' }),
    }),
    tipoPan: z.nativeEnum(TipoPan, {
      errorMap: () => ({ message: 'Tipo de pan inválido' }),
    }),
    ingredientes: z
      .array(z.string())
      .min(1, 'Debe seleccionar al menos un ingrediente')
      .max(10, 'Demasiados ingredientes'),
    bocataPredefinido: z.string().optional(),
  })
  .refine(
    (data) => {
      // Pan integral y semillas solo pueden ser tamaño normal
      if (
        (data.tipoPan === TipoPan.INTEGRAL || data.tipoPan === TipoPan.SEMILLAS) &&
        data.tamano === TamanoBocadillo.GRANDE
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Pan integral y semillas solo pueden ser de tamaño normal',
      path: ['tipoPan'],
    }
  );

export type CreateBocadilloInput = z.infer<typeof createBocadilloSchema>;

import { TamanoBocadillo, TipoPan } from '../models/Bocadillo';

export interface BocataPredefinido {
  nombre: string;
  ingredientes: string[];
  tamano: TamanoBocadillo;
  tipoPan: TipoPan;
}

export const INGREDIENTES_DISPONIBLES = [
  'Jamón',
  'Longaniza',
  'Tortilla',
  'Queso',
  'Tomate',
  'Lechuga',
  'Atún',
  'Pavo',
  'Chorizo',
  'Bacon',
  'Huevo',
  'Mayonesa',
  'Ketchup',
  'Mostaza',
];

export const BOCATAS_PREDEFINIDOS: BocataPredefinido[] = [
  {
    nombre: 'Alquimista',
    ingredientes: ['Jamón', 'Queso', 'Tomate', 'Lechuga'],
    tamano: TamanoBocadillo.NORMAL,
    tipoPan: TipoPan.NORMAL,
  },
  {
    nombre: 'Chivito',
    ingredientes: ['Pavo', 'Bacon', 'Huevo', 'Mayonesa'],
    tamano: TamanoBocadillo.GRANDE,
    tipoPan: TipoPan.NORMAL,
  },
  {
    nombre: 'Blanco y Negro',
    ingredientes: ['Chorizo', 'Tortilla', 'Queso'],
    tamano: TamanoBocadillo.NORMAL,
    tipoPan: TipoPan.INTEGRAL,
  },
];

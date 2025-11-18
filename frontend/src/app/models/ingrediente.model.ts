export interface Ingrediente {
  _id?: string;
  nombre: string;
  categoria?: string;
  disponible: boolean;
  orden: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateIngredienteDto {
  nombre: string;
  categoria?: string;
  disponible?: boolean;
  orden?: number;
}

export interface UpdateIngredienteDto {
  nombre?: string;
  categoria?: string;
  disponible?: boolean;
  orden?: number;
}

import mongoose, { Document, Schema } from 'mongoose';

export enum TamañoBocadillo {
  NORMAL = 'normal',
  GRANDE = 'grande',
}

export enum TipoPan {
  NORMAL = 'normal',
  INTEGRAL = 'integral',
  SEMILLAS = 'semillas',
}

export interface IBocadillo extends Document {
  nombre: string;
  tamaño: TamañoBocadillo;
  tipoPan: TipoPan;
  ingredientes: string[];
  bocataPredefinido?: string;
  semana: number; // Número de semana del año
  año: number;
  fechaCreacion: Date;
}

const BocadilloSchema: Schema = new Schema({
  nombre: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  tamaño: {
    type: String,
    enum: Object.values(TamañoBocadillo),
    required: true,
  },
  tipoPan: {
    type: String,
    enum: Object.values(TipoPan),
    required: true,
  },
  ingredientes: {
    type: [String],
    required: true,
    validate: {
      validator: function (v: string[]) {
        return v.length > 0;
      },
      message: 'Debe seleccionar al menos un ingrediente',
    },
  },
  bocataPredefinido: {
    type: String,
    required: false,
  },
  semana: {
    type: Number,
    required: true,
  },
  año: {
    type: Number,
    required: true,
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
});

// Índice para búsquedas eficientes por semana
BocadilloSchema.index({ semana: 1, año: 1 });

export default mongoose.model<IBocadillo>('Bocadillo', BocadilloSchema);

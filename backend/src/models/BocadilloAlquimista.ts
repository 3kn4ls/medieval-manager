import mongoose, { Document, Schema } from 'mongoose';
import { TamanoBocadillo, TipoPan } from './Bocadillo';

export interface IBocadilloAlquimista extends Document {
  tamano: TamanoBocadillo;
  tipoPan: TipoPan;
  ingredientes: string[];
  semana: number;
  ano: number;
  createdAt: Date;
  updatedAt: Date;
}

const BocadilloAlquimistaSchema: Schema = new Schema(
  {
    tamano: {
      type: String,
      enum: Object.values(TamanoBocadillo),
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
    semana: {
      type: Number,
      required: true,
    },
    ano: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice único para asegurar que solo haya un Alquimista por semana
BocadilloAlquimistaSchema.index({ semana: 1, ano: 1 }, { unique: true });

export default mongoose.model<IBocadilloAlquimista>(
  'BocadilloAlquimista',
  BocadilloAlquimistaSchema
);

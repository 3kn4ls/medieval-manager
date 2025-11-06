import mongoose, { Document, Schema } from 'mongoose';

export interface ISemana extends Document {
  numeroSemana: number;
  año: number;
  fechaInicio: Date;
  fechaFin: Date;
  activa: boolean;
  cerrada: boolean;
}

const SemanaSchema: Schema = new Schema({
  numeroSemana: {
    type: Number,
    required: true,
  },
  año: {
    type: Number,
    required: true,
  },
  fechaInicio: {
    type: Date,
    required: true,
  },
  fechaFin: {
    type: Date,
    required: true,
  },
  activa: {
    type: Boolean,
    default: true,
  },
  cerrada: {
    type: Boolean,
    default: false,
  },
});

// Índice único para semana + año
SemanaSchema.index({ numeroSemana: 1, año: 1 }, { unique: true });

export default mongoose.model<ISemana>('Semana', SemanaSchema);

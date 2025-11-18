import mongoose, { Document, Schema } from 'mongoose';

export interface IIngrediente extends Document {
  nombre: string;
  disponible: boolean;
  orden: number;
  createdAt: Date;
  updatedAt: Date;
}

const IngredienteSchema: Schema = new Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  disponible: {
    type: Boolean,
    default: true,
  },
  orden: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Actualizar updatedAt antes de guardar
IngredienteSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Índice para ordenar
IngredienteSchema.index({ orden: 1, nombre: 1 });

export default mongoose.model<IIngrediente>('Ingrediente', IngredienteSchema);

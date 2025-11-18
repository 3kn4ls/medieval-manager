import mongoose, { Document, Schema } from 'mongoose';

export interface IIngrediente extends Document {
  nombre: string;
  categoria?: string;
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
    trim: true,
  },
  categoria: {
    type: String,
    trim: true,
    default: 'General',
  },
  disponible: {
    type: Boolean,
    default: true,
  },
  orden: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Índice para búsqueda y ordenación
IngredienteSchema.index({ disponible: 1, orden: 1 });
IngredienteSchema.index({ nombre: 1 });

export default mongoose.model<IIngrediente>('Ingrediente', IngredienteSchema);

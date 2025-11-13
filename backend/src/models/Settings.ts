import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  publicRegistrationEnabled: boolean;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema({
  publicRegistrationEnabled: {
    type: Boolean,
    default: false, // Por defecto desactivado
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Actualizar updatedAt antes de guardar
SettingsSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);

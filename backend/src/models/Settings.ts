import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  publicRegistrationEnabled: boolean;
  ordersClosed: boolean;
  closedMessage: string;
  closedUntilDate?: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema({
  publicRegistrationEnabled: {
    type: Boolean,
    default: false,
  },
  ordersClosed: {
    type: Boolean,
    default: false,
  },
  closedMessage: {
    type: String,
    default: 'Las solicitudes de bocadillos están cerradas temporalmente',
  },
  closedUntilDate: {
    type: Date,
    default: null,
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

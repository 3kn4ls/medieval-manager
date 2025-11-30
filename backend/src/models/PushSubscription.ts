import mongoose, { Document, Schema } from 'mongoose';

export interface IPushSubscription extends Document {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
}

const PushSubscriptionSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  endpoint: {
    type: String,
    required: true,
  },
  keys: {
    p256dh: {
      type: String,
      required: true,
    },
    auth: {
      type: String,
      required: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Índice único para evitar suscripciones duplicadas
PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

export default mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);

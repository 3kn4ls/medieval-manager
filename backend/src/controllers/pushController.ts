import { Request, Response } from 'express';
import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription';
import { AuthRequest } from '../middleware/auth';

// Configurar web-push con las claves VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@medievalmanager.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

// Obtener clave pública VAPID
export const getVapidPublicKey = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      publicKey: process.env.VAPID_PUBLIC_KEY,
    });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la clave pública',
    });
  }
};

// Suscribir usuario a notificaciones push
export const subscribe = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
    }

    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({
        success: false,
        error: 'Datos de suscripción inválidos',
      });
    }

    // Crear o actualizar suscripción
    await PushSubscription.findOneAndUpdate(
      { userId: user.userId, endpoint },
      {
        userId: user.userId,
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Suscripción creada correctamente',
    });
  } catch (error) {
    console.error('Error subscribing to push:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la suscripción',
    });
  }
};

// Cancelar suscripción
export const unsubscribe = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
    }

    const { endpoint } = req.body;

    await PushSubscription.deleteOne({
      userId: user.userId,
      endpoint,
    });

    res.json({
      success: true,
      message: 'Suscripción cancelada correctamente',
    });
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cancelar la suscripción',
    });
  }
};

// Enviar notificación a todos los usuarios suscritos
export const sendNotificationToAll = async (title: string, body: string, data?: any) => {
  try {
    const subscriptions = await PushSubscription.find({});

    const payload = JSON.stringify({
      title,
      body,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/icon-96x96.png',
      data: data || {},
    });

    const notifications = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          },
          payload
        );
      } catch (error: any) {
        // Si la suscripción es inválida, eliminarla
        if (error.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: subscription._id });
        }
        console.error('Error sending notification:', error);
      }
    });

    await Promise.all(notifications);
    console.log(`Sent ${subscriptions.length} notifications`);
  } catch (error) {
    console.error('Error sending notifications to all:', error);
    throw error;
  }
};

// Endpoint para que admin envíe notificaciones manuales (solo admin)
export const sendManualNotification = async (req: Request, res: Response) => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Título y mensaje son requeridos',
      });
    }

    await sendNotificationToAll(title, body, data);

    res.json({
      success: true,
      message: 'Notificaciones enviadas correctamente',
    });
  } catch (error) {
    console.error('Error sending manual notification:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar las notificaciones',
    });
  }
};

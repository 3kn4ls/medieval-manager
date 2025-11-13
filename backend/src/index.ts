import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import bocadilloRoutes from './routes/bocadilloRoutes';
import menuRoutes from './routes/menuRoutes';
import authRoutes from './routes/authRoutes';
import alquimistaRoutes from './routes/alquimistaRoutes';
import User, { UserRole } from './models/User';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS configuration (temporary: allow all for debugging)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de peticiones en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/bocadillos', bocadilloRoutes);
app.use('/api/alquimista', alquimistaRoutes);
app.use('/api/menu', menuRoutes);

// Ruta 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador de errores global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Función para crear el usuario admin inicial
const createInitialAdmin = async () => {
  try {
    const adminData = {
      username: 'admin',
      password: 'admin123',
      nombre: 'EDUARDO CANALS',
      role: UserRole.ADMIN,
    };

    const existingAdmin = await User.findOne({ username: adminData.username });

    if (!existingAdmin) {
      const admin = new User(adminData);
      await admin.save();
      console.log('✅ Usuario administrador inicial creado');
      console.log(`   Username: ${admin.username}`);
      console.log(`   Password: ${adminData.password} (cambiar después del primer login)`);
      console.log(`   Nombre: ${admin.nombre}`);
    } else {
      console.log('ℹ️  Usuario administrador ya existe');
    }
  } catch (error) {
    console.error('⚠️  Error al crear usuario administrador inicial:', error);
    // No detenemos el servidor si falla la creación del admin
  }
};

// Iniciar servidor
const startServer = async () => {
  try {
    await connectDatabase();

    // Crear admin inicial automáticamente
    await createInitialAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:4200'}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

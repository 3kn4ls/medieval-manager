import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User, { UserRole } from '../models/User';
import { connectDatabase } from '../config/database';

dotenv.config();

const createAdminUser = async () => {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await connectDatabase();

    // Datos del usuario administrador
    const adminData = {
      username: 'admin',
      password: 'admin123', // Cambiar esto en producción
      nombre: 'EDUARDO CANALS',
      role: UserRole.ADMIN,
    };

    // Verificar si el usuario admin ya existe
    const existingAdmin = await User.findOne({ username: adminData.username });

    if (existingAdmin) {
      console.log('⚠️  El usuario admin ya existe en la base de datos');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Nombre: ${existingAdmin.nombre}`);
      console.log(`   Role: ${existingAdmin.role}`);
      process.exit(0);
    }

    // Crear el usuario admin
    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Usuario administrador creado correctamente!');
    console.log('\n📋 Detalles del usuario:');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Password: ${adminData.password} (temporal - cambiar después del primer login)`);
    console.log(`   Nombre: ${admin.nombre}`);
    console.log(`   Role: ${admin.role}`);
    console.log('\n🔐 Puedes iniciar sesión con estas credenciales en /login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear el usuario administrador:', error);
    process.exit(1);
  }
};

// Ejecutar el script
createAdminUser();

import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';
import Ingrediente from '../models/Ingrediente';
import { INGREDIENTES_DISPONIBLES } from '../config/menu';

// Cargar variables de entorno
dotenv.config();

/**
 * Script para migrar ingredientes del archivo de configuración a la base de datos
 */
const migrateIngredientes = async () => {
  try {
    console.log('🔄 Iniciando migración de ingredientes...');

    // Conectar a la base de datos
    await connectDatabase();

    // Verificar si ya existen ingredientes en la BD
    const existingCount = await Ingrediente.countDocuments();

    if (existingCount > 0) {
      console.log(`⚠️  Ya existen ${existingCount} ingredientes en la base de datos.`);
      console.log('¿Desea continuar? Esto agregará ingredientes nuevos sin duplicar los existentes.');
    }

    // Categorizar ingredientes (esto es opcional, puedes ajustarlo según necesites)
    const categorizarIngrediente = (nombre: string): string => {
      const nombreLower = nombre.toLowerCase();

      if (nombreLower.includes('pollo') || nombreLower.includes('costillas') ||
          nombreLower.includes('carillada') || nombreLower.includes('chilindron') ||
          nombreLower.includes('kebab')) {
        return 'Carnes y Aves';
      }
      if (nombreLower.includes('tortilla')) {
        return 'Tortillas';
      }
      if (nombreLower.includes('jamón') || nombreLower.includes('longaniza') ||
          nombreLower.includes('chorizo') || nombreLower.includes('morcilla') ||
          nombreLower.includes('pavo') || nombreLower.includes('bacon')) {
        return 'Embutidos';
      }
      if (nombreLower.includes('queso')) {
        return 'Quesos';
      }
      if (nombreLower.includes('tomate') || nombreLower.includes('lechuga') ||
          nombreLower.includes('cebolla') || nombreLower.includes('ensalada') ||
          nombreLower.includes('olivas')) {
        return 'Vegetales';
      }
      if (nombreLower.includes('atún') || nombreLower.includes('anchoas') ||
          nombreLower.includes('mojama')) {
        return 'Pescados';
      }
      if (nombreLower.includes('huevo')) {
        return 'Huevos';
      }
      if (nombreLower.includes('mayonesa') || nombreLower.includes('mostaza') ||
          nombreLower.includes('aceite')) {
        return 'Condimentos';
      }
      if (nombreLower.includes('patata')) {
        return 'Guarniciones';
      }

      return 'Otros';
    };

    let agregados = 0;
    let duplicados = 0;

    // Insertar ingredientes
    for (let i = 0; i < INGREDIENTES_DISPONIBLES.length; i++) {
      const nombreIngrediente = INGREDIENTES_DISPONIBLES[i];

      // Verificar si ya existe
      const existente = await Ingrediente.findOne({
        nombre: { $regex: new RegExp(`^${nombreIngrediente}$`, 'i') }
      });

      if (existente) {
        console.log(`⏭️  Ingrediente "${nombreIngrediente}" ya existe, saltando...`);
        duplicados++;
        continue;
      }

      // Crear nuevo ingrediente
      const ingrediente = new Ingrediente({
        nombre: nombreIngrediente,
        categoria: categorizarIngrediente(nombreIngrediente),
        disponible: true,
        orden: i,
      });

      await ingrediente.save();
      console.log(`✅ Ingrediente "${nombreIngrediente}" agregado (orden: ${i})`);
      agregados++;
    }

    console.log('\n📊 Resumen de la migración:');
    console.log(`   • Ingredientes agregados: ${agregados}`);
    console.log(`   • Ingredientes duplicados (saltados): ${duplicados}`);
    console.log(`   • Total en configuración: ${INGREDIENTES_DISPONIBLES.length}`);

    const totalEnBD = await Ingrediente.countDocuments();
    console.log(`   • Total en base de datos: ${totalEnBD}`);

    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
};

// Ejecutar migración
migrateIngredientes();

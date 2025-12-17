// scripts/seed-menu.ts
import 'dotenv/config';
import mongoose from 'mongoose';
import MenuProduct from '../models/MenuProduct';
import Flavor from '../models/Flavor';
import Style from '../models/Style';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pollos-don-agus';

async function seedMenu() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: 'pollos-don-agus' });
    console.log('Conectado a MongoDB');

    // Limpiar datos existentes
    await MenuProduct.deleteMany({});
    await Flavor.deleteMany({});
    await Style.deleteMany({});

    // Crear estilos
    const asado = await Style.create({
      name: 'asado',
      displayName: 'Asado',
      isActive: true,
      sortOrder: 1,
    });

    const rostizado = await Style.create({
      name: 'rostizado',
      displayName: 'Rostizado',
      isActive: true,
      sortOrder: 2,
    });

    console.log('✅ Estilos creados');

    // Crear sabores
    const flavors = await Flavor.insertMany([
      { name: 'Sinaloa (Natural)', price: 0, isActive: true, sortOrder: 1 },
      { name: 'BBQ', price: 0, isActive: true, sortOrder: 2 },
      { name: 'BBQ Picante', price: 0, isActive: true, sortOrder: 3 },
      { name: 'Juan Gabriel', price: 0, isActive: true, sortOrder: 4 },
      { name: 'Jalapeño', price: 0, isActive: true, sortOrder: 5 },
      { name: 'Chipotle', price: 0, isActive: true, sortOrder: 6 },
      { name: 'Niurka', price: 0, isActive: true, sortOrder: 7 },
    ]);

    console.log('✅ Sabores creados');

    // Crear productos del menú
    const allFlavorIds = flavors.map((f) => f._id);
    const allStyleIds = [asado._id, rostizado._id];

    await MenuProduct.insertMany([
      {
        code: 'pollo',
        name: 'Pollo completo',
        description: 'Ideal para familia o compartir.',
        price: 200,
        isActive: true,
        availableFlavors: allFlavorIds,
        availableStyles: allStyleIds,
        showOnlyInStore: false,
        sortOrder: 1,
      },
      {
        code: 'medio_pollo',
        name: '1/2 Pollo',
        description: 'Para antojo individual o compartir ligero.',
        price: 100,
        isActive: true,
        availableFlavors: allFlavorIds,
        availableStyles: allStyleIds,
        showOnlyInStore: false,
        sortOrder: 2,
      },
      {
        code: 'costillar_medio',
        name: '1/2 Costillar',
        description: 'Costillas a la leña para una o dos personas.',
        price: 100,
        isActive: true,
        availableFlavors: allFlavorIds,
        availableStyles: [],
        showOnlyInStore: false,
        sortOrder: 3,
      },
      {
        code: 'costillar_normal',
        name: 'Costillar',
        description: 'Costillas en su punto, perfectas para compartir.',
        price: 200,
        isActive: true,
        availableFlavors: allFlavorIds,
        availableStyles: [],
        showOnlyInStore: false,
        sortOrder: 4,
      },
      {
        code: 'costillar_grande',
        name: 'Costillar Grande',
        description: 'Porción generosa para varios comensales.',
        price: 250,
        isActive: true,
        availableFlavors: allFlavorIds,
        availableStyles: [],
        showOnlyInStore: false,
        sortOrder: 5,
      },
      // Ejemplos de productos inactivos (solo en tienda)
      {
        code: 'lechon',
        name: 'Lechón',
        description: 'Lechón completo a la leña.',
        price: 300,
        isActive: true,
        availableFlavors: [],
        availableStyles: [],
        showOnlyInStore: true, // Solo disponible en tienda
        sortOrder: 6,
      },
      {
        code: 'alitas',
        name: 'Alitas',
        description: 'Alitas de pollo a la leña.',
        price: 180,
        isActive: true,
        availableFlavors: allFlavorIds,
        availableStyles: [],
        showOnlyInStore: true, // Solo disponible en tienda
        sortOrder: 7,
      },
    ]);

    console.log('✅ Productos del menú creados');
    console.log('\n🎉 Seed del menú completado exitosamente!');
    console.log('\nProductos activos:');
    const activeProducts = await MenuProduct.find({ isActive: true }).sort({ sortOrder: 1 });
    activeProducts.forEach((p) => {
      console.log(`  - ${p.code}: ${p.name} ($${p.price})`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedMenu();


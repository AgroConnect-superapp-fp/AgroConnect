/**
 * Seed de productos del marketplace para desarrollo local.
 *
 * Uso:
 *   DATABASE_URL=... DATABASE_SCHEMA=agroconnect \
 *     npm run seed:products -w @agroconnect/api
 *
 * Es idempotente: usa UUID fijos y `upsert`, así que puede ejecutarse varias
 * veces sin duplicar filas. No se ejecuta en producción automáticamente.
 */
import 'dotenv/config';
import { createPrismaContext } from './lib/prisma';
import type {
  ProductCertification,
  ProductCrop,
} from '../src/modules/marketplace/domain/entities/Product';

interface SeedProduct {
  id: string;
  name: string;
  owner: string;
  description: string;
  contact: string;
  department: string;
  municipality: string;
  crop: ProductCrop;
  area: number;
  productivity: number;
  certification: ProductCertification;
  lat: number;
  lng: number;
  images: { publicId: string; alt: string }[];
}

const PRODUCTS: SeedProduct[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    name: 'Finca La Esperanza',
    owner: 'Carlos Andrés Martínez Rodríguez',
    description:
      'Finca familiar en las montañas de Cundinamarca, especializada en café de especialidad con prácticas orgánicas certificadas.',
    contact: '+57 310 555 12 34',
    department: 'Cundinamarca',
    municipality: 'La Mesa',
    crop: 'coffee',
    area: 50,
    productivity: 85,
    certification: 'organic',
    lat: 4.6249,
    lng: -74.0679,
    images: [
      { publicId: 'cld-sample-4', alt: 'Paisaje montañoso de la finca cafetera' },
      { publicId: 'main-sample', alt: 'Vista panorámica de los cultivos de café' },
    ],
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    name: 'Hacienda El Paraíso',
    owner: 'María González López',
    description:
      'Hacienda cañera del Valle del Cauca con tres generaciones de experiencia y prácticas de comercio justo.',
    contact: '+57 315 555 56 78',
    department: 'Valle del Cauca',
    municipality: 'Palmira',
    crop: 'sugarcane',
    area: 120,
    productivity: 92,
    certification: 'fair_trade',
    lat: 3.4516,
    lng: -76.532,
    images: [
      { publicId: 'samples/coffee', alt: 'Productos derivados de la caña de azúcar' },
      { publicId: 'samples/balloons', alt: 'Celebración de cosecha en la hacienda' },
    ],
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    name: 'Finca San José',
    owner: 'José Rodrigo Rodríguez',
    description:
      'Pequeña finca cacaotera antioqueña dedicada al cacao fino de aroma, con fermentación y secado artesanales.',
    contact: '+57 312 555 23 45',
    department: 'Antioquia',
    municipality: 'Jericó',
    crop: 'cacao',
    area: 35,
    productivity: 78,
    certification: 'organic',
    lat: 5.791,
    lng: -75.728,
    images: [
      { publicId: 'samples/food/spices', alt: 'Cacao y especias de la finca' },
      { publicId: 'samples/landscapes/nature', alt: 'Paisaje de la finca cacaotera' },
    ],
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    name: 'Finca La Victoria',
    owner: 'Ana Pérez',
    description:
      'Finca bananera del Cesar con producción continua y manejo responsable del agua durante todo el año.',
    contact: '+57 318 555 34 56',
    department: 'Cesar',
    municipality: 'Valledupar',
    crop: 'banana',
    area: 80,
    productivity: 65,
    certification: 'conventional',
    lat: 10.4631,
    lng: -73.2532,
    images: [
      { publicId: 'samples/food/fish', alt: 'Cultivos de banano de la región' },
      { publicId: 'samples/landscapes/beach-boat', alt: 'Paisaje agrícola del Cesar' },
    ],
  },
  {
    id: '11111111-1111-4111-8111-111111111105',
    name: 'Hacienda El Triunfo',
    owner: 'Luis Hernández Castro',
    description:
      'Arrocera del Cauca con infraestructura de riego y trazabilidad completa desde el cultivo hasta el empaque.',
    contact: '+57 320 555 45 67',
    department: 'Cauca',
    municipality: 'Popayán',
    crop: 'rice',
    area: 200,
    productivity: 88,
    certification: 'conventional',
    lat: 2.4448,
    lng: -76.6147,
    images: [
      { publicId: 'samples/landscapes/beach-boat', alt: 'Campos de arroz del Cauca' },
      { publicId: 'samples/food/spices', alt: 'Grano de arroz listo para empaque' },
    ],
  },
  {
    id: '11111111-1111-4111-8111-111111111106',
    name: 'Finca Los Andes',
    owner: 'Rosa María Jiménez Torres',
    description:
      'Caficultora de Caldas con procesos de beneficio tradicional y tazas con notas a chocolate y frutas rojas.',
    contact: '+57 313 555 56 78',
    department: 'Caldas',
    municipality: 'Manizales',
    crop: 'coffee',
    area: 45,
    productivity: 94,
    certification: 'organic',
    lat: 5.0689,
    lng: -75.5174,
    images: [
      { publicId: 'main-sample', alt: 'Cafetal en las montañas de Caldas' },
      { publicId: 'cld-sample-4', alt: 'Granos de café de la finca' },
    ],
  },
  {
    id: '11111111-1111-4111-8111-111111111107',
    name: 'Hacienda Santa Fe',
    owner: 'Pedro Gómez',
    description:
      'Palma de aceite en Córdoba con prácticas de manejo de suelo y cobertura vegetal para proteger la cuenca.',
    contact: '+57 314 555 67 89',
    department: 'Córdoba',
    municipality: 'Montería',
    crop: 'oil_palm',
    area: 180,
    productivity: 71,
    certification: 'conventional',
    lat: 8.748,
    lng: -75.8814,
    images: [
      { publicId: 'samples/landscapes/nature', alt: 'Palma de aceite en Córdoba' },
      { publicId: 'samples/landscapes/beach-boat', alt: 'Paisaje de la hacienda' },
    ],
  },
  {
    id: '11111111-1111-4111-8111-111111111108',
    name: 'Finca El Recreo',
    owner: 'Carmen Díaz Ospina',
    description:
      'Cacao de Nariño cultivado en suelos volcánicos, con fermentación controlada y perfil sensorial intenso.',
    contact: '+57 316 555 78 90',
    department: 'Nariño',
    municipality: 'Tumaco',
    crop: 'cacao',
    area: 28,
    productivity: 82,
    certification: 'fair_trade',
    lat: 1.7986,
    lng: -78.7926,
    images: [
      { publicId: 'samples/food/spices', alt: 'Mazorcas de cacao de Nariño' },
      { publicId: 'samples/landscapes/nature', alt: 'Finca cacaotera en Nariño' },
    ],
  },
  {
    id: '11111111-1111-4111-8111-111111111109',
    name: 'Finca La Cosecha',
    owner: 'Jorge Ramírez',
    description:
      'Productora de maíz en el Meta con rotación de cultivos y abastecimiento a mercados regionales.',
    contact: '+57 317 555 89 01',
    department: 'Meta',
    municipality: 'Villavicencio',
    crop: 'corn',
    area: 95,
    productivity: 58,
    certification: 'conventional',
    lat: 4.142,
    lng: -73.6266,
    images: [
      { publicId: 'samples/landscapes/beach-boat', alt: 'Cultivo de maíz en el Meta' },
      { publicId: 'samples/food/fish', alt: 'Cosecha de maíz' },
    ],
  },
  {
    id: '11111111-1111-4111-8111-111111111110',
    name: 'Finca El Progreso',
    owner: 'Sofía Vargas Gutiérrez',
    description:
      'Finca yucal de Norte de Santander con tradición familiar y producción para mercados nacionales.',
    contact: '+57 317 555 01 23',
    department: 'Norte de Santander',
    municipality: 'Cúcuta',
    crop: 'cassava',
    area: 60,
    productivity: 73,
    certification: 'conventional',
    lat: 7.1193,
    lng: -73.1227,
    images: [
      { publicId: 'samples/landscapes/beach-boat', alt: 'Paisaje de Norte de Santander' },
      { publicId: 'samples/food/spices', alt: 'Yuca y productos agrícolas frescos' },
    ],
  },
];

function polygon(lat: number, lng: number): [number, number][] {
  return [
    [lat + 0.002, lng - 0.002],
    [lat + 0.004, lng + 0.001],
    [lat, lng + 0.003],
    [lat - 0.002, lng - 0.001],
  ];
}

async function main(): Promise<void> {
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('El seed de productos está prohibido en producción.');
  }

  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error('DATABASE_URL es obligatoria para ejecutar el seed.');
  }

  const context = createPrismaContext(
    connectionString,
    process.env['DATABASE_SCHEMA'] ?? 'public',
  );
  const { prisma } = context;

  try {
    for (const product of PRODUCTS) {
      const { id, lat, lng, area, images, ...rest } = product;
      const data = {
        ...rest,
        areaHectares: area,
        lat,
        lng,
        images,
        moderationStatus: 'approved' as const,
        coordinates: polygon(lat, lng),
      };

      await prisma.product.upsert({
        where: { id },
        update: data,
        create: { id, ...data },
      });
    }

    console.log(`Seed del marketplace completado: ${PRODUCTS.length} productos.`);
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error('Error ejecutando el seed del marketplace:', error);
  process.exitCode = 1;
});

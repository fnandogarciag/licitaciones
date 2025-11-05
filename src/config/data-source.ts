import 'reflect-metadata';
import { DataSource } from 'typeorm';

// Importar todas las entidades (usar rutas relativas para que el código compilado
// funcione correctamente en tiempo de ejecución dentro del contenedor)
import { Proceso } from '../modules/procesos/proceso.entity';
import { Entidad } from '../modules/entidades/entidad.entity';
import { EstadoProceso } from '../modules/estado_proceso/estado_proceso.entity';
import { TipoProceso } from '../modules/tipo_proceso/tipo_proceso.entity';
import { FechaProceso } from '../modules/fecha_proceso/fecha_proceso.entity';
import { Lote } from '../modules/lotes/lote.entity';
import { Oferta } from '../modules/ofertas/oferta.entity';
import { Consorcio } from '../modules/consorcios/consorcio.entity';
import { ConsorcioEmpresa } from '../modules/consorcio_empresa/consorcio_empresa.entity';
import { Empresa } from '../modules/empresas/empresa.entity';
import { TipoFechaProceso } from '../modules/tipo_fecha_proceso/tipo_fecha_proceso.entity';

const isProd = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  database: process.env.DB_NAME ?? 'licitaciones',

  // Configuración de desarrollo vs producción
  // Desactivar sincronización automática y migraciones de TypeORM
  // ya que usamos migraciones SQL directamente
  synchronize: false,
  logging: !isProd, // Solo logging en desarrollo

  // No usar migraciones de TypeORM ya que usamos SQL directo
  migrations: [],
  migrationsRun: false,

  // Entidades importadas directamente
  entities: [
    Proceso,
    Entidad,
    EstadoProceso,
    TipoProceso,
    FechaProceso,
    Lote,
    Oferta,
    Consorcio,
    ConsorcioEmpresa,
    Empresa,
    TipoFechaProceso,
  ],
});

export const initializeDatabase = async () => {
  if (!AppDataSource.isInitialized) {
    let retries = 5;
    while (retries > 0) {
      try {
        await AppDataSource.initialize();
        console.log('✅ Database initialized successfully');
        return AppDataSource;
      } catch (error) {
        console.error(
          `❌ Error during database initialization (${retries} retries left):`,
          error,
        );
        retries--;
        if (retries === 0) {
          throw error;
        }
        // Wait 5 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }
  return AppDataSource;
};

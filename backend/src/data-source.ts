import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import fs from 'fs';

/* eslint-disable no-console */

const isProd = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  database: process.env.DB_NAME ?? 'licitaciones',

  // Solo sincroniza en desarrollo
  synchronize: !isProd,
  logging: !isProd,
  // Vamos a poblar `entities` dinámicamente en tiempo de ejecución para que la
  // inicialización del DataSource pueda cargar las clases de entidad desde la
  // carpeta compilada `dist/entities`.
  entities: [],
  migrations: [],
});

// Ayudante: carga las clases exportadas desde los archivos JS dentro de `dist/entities`
function loadEntityClasses(): any[] {
  const out = process.env.BUILD_OUTDIR || 'dist';
  const entitiesDir = path.join(process.cwd(), out, 'entities');
  // Diagnóstico: imprimir contexto
  console.debug(
    '[data-source] NODE_ENV=',
    process.env.NODE_ENV,
    'cwd=',
    process.cwd(),
  );
  if (!fs.existsSync(entitiesDir)) return [];
  const files = fs.readdirSync(entitiesDir).filter((f) => f.endsWith('.js'));
  console.debug('[data-source] entitiesDir=', entitiesDir, 'files=', files);
  const classes: any[] = [];
  for (const file of files) {
    try {
      const full = path.join(entitiesDir, file);
      console.debug('[data-source] require entity file=', full);
      const mod = require(full);
      for (const k of Object.keys(mod)) {
        const v = mod[k];
        if (typeof v === 'function') classes.push(v);
      }
    } catch (e) {
      console.error(
        '[data-source] failed to require entity',
        file,
        e && ((e as any).stack || e),
      );
    }
  }
  return classes;
}

// Sobrescribimos `initialize` para poblar las entidades justo antes de la inicialización.
const originalInitialize = AppDataSource.initialize.bind(AppDataSource);
(AppDataSource as any).initialize = async function () {
  try {
    // Si no hay entidades configuradas, descubrir clases de entidad compiladas en tiempo de ejecución
    const configuredEntities = (AppDataSource.options as any).entities;
    if (
      !configuredEntities ||
      !(Array.isArray(configuredEntities) && configuredEntities.length > 0)
    ) {
      // Diagnóstico: intentar mostrar desde dónde se resuelve 'typeorm'
      try {
        console.debug(
          '[data-source] require.resolve(typeorm)=',
          require.resolve('typeorm'),
        );
      } catch (e) {
        console.warn(
          '[data-source] require.resolve(typeorm) failed',
          e && ((e as any).message || e),
        );
      }

      const loaded = loadEntityClasses();
      console.debug(
        '[data-source] loaded entity classes count=',
        loaded.length,
      );
      if (loaded.length > 0) {
        (AppDataSource.options as any).entities = loaded;
      }
      if (
        !(
          (AppDataSource.options as any).entities &&
          Array.isArray((AppDataSource.options as any).entities) &&
          (AppDataSource.options as any).entities.length > 0
        )
      ) {
        console.warn(
          '[data-source] no entities were registered on AppDataSource.options.entities',
        );
      }
    }
    return await originalInitialize();
  } catch (error) {
    console.error('❌ Error during Data Source initialization', error);
    throw error;
  }
};

export const initializeDatabase = async () => {
  return (AppDataSource as any).initialize();
};

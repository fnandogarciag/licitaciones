"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
// Importar todas las entidades (usar rutas relativas para que el código compilado
// funcione correctamente en tiempo de ejecución dentro del contenedor)
const proceso_entity_1 = require("../modules/procesos/proceso.entity");
const entidad_entity_1 = require("../modules/entidades/entidad.entity");
const estado_proceso_entity_1 = require("../modules/estado_proceso/estado_proceso.entity");
const tipo_proceso_entity_1 = require("../modules/tipo_proceso/tipo_proceso.entity");
const fecha_proceso_entity_1 = require("../modules/fecha_proceso/fecha_proceso.entity");
const lote_entity_1 = require("../modules/lotes/lote.entity");
const oferta_entity_1 = require("../modules/ofertas/oferta.entity");
const consorcio_entity_1 = require("../modules/consorcios/consorcio.entity");
const consorcio_empresa_entity_1 = require("../modules/consorcio_empresa/consorcio_empresa.entity");
const empresa_entity_1 = require("../modules/empresas/empresa.entity");
const tipo_fecha_proceso_entity_1 = require("../modules/tipo_fecha_proceso/tipo_fecha_proceso.entity");
const isProd = process.env.NODE_ENV === 'production';
exports.AppDataSource = new typeorm_1.DataSource({
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
        proceso_entity_1.Proceso,
        entidad_entity_1.Entidad,
        estado_proceso_entity_1.EstadoProceso,
        tipo_proceso_entity_1.TipoProceso,
        fecha_proceso_entity_1.FechaProceso,
        lote_entity_1.Lote,
        oferta_entity_1.Oferta,
        consorcio_entity_1.Consorcio,
        consorcio_empresa_entity_1.ConsorcioEmpresa,
        empresa_entity_1.Empresa,
        tipo_fecha_proceso_entity_1.TipoFechaProceso,
    ],
});
const initializeDatabase = async () => {
    if (!exports.AppDataSource.isInitialized) {
        let retries = 5;
        while (retries > 0) {
            try {
                await exports.AppDataSource.initialize();
                console.log('✅ Database initialized successfully');
                return exports.AppDataSource;
            }
            catch (error) {
                console.error(`❌ Error during database initialization (${retries} retries left):`, error);
                retries--;
                if (retries === 0) {
                    throw error;
                }
                // Wait 5 seconds before retrying
                await new Promise((resolve) => setTimeout(resolve, 5000));
            }
        }
    }
    return exports.AppDataSource;
};
exports.initializeDatabase = initializeDatabase;

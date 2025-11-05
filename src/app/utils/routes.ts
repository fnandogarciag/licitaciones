/**
 * Centralizador de rutas de la API para el sistema de licitaciones.
 *
 * Este módulo define todas las rutas de la API disponibles en el sistema,
 * permitiendo:
 * - Mantener consistencia en las llamadas a endpoints
 * - Facilitar cambios de rutas desde un único lugar
 * - Evitar errores por typos al escribir las rutas manualmente
 * - Autocompletar rutas al importar el objeto API_ROUTES
 *
 * Las rutas cubren todos los recursos principales:
 * - Procesos y sus estados/tipos
 * - Entidades contratantes
 * - Lotes y ofertas
 * - Consorcios y empresas
 * - Fechas del proceso
 */
export const API_ROUTES = {
  ENTIDADES: '/api/entidades',
  PROCESOS: '/api/procesos',
  LOTES: '/api/lotes',
  CONSORCIOS: '/api/consorcios',
  EMPRESAS: '/api/empresas',
  TIPO_PROCESO: '/api/tipo_proceso',
  TIPO_FECHA_PROCESO: '/api/tipo_fecha_proceso',
  ESTADO_PROCESO: '/api/estado_proceso',
  OFERTAS: '/api/ofertas',
  FECHA_PROCESO: '/api/fecha_proceso',
  LOGIN: '/api/login',
} as const;

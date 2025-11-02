import type { NextConfig } from 'next';
import { createRequire } from 'module';

// Tipamos como `any` aquí para permitir propiedades experimentales
// no tipadas por la definición de Next.js en el entorno de desarrollo.
// Esto preserva la configuración en runtime (p. ej. serverExternalPackages)
// sin provocar errores de TypeScript por propiedades desconocidas.
const nextConfig: any = {
  reactStrictMode: true,
  eslint: {
    // Proyectos con archivos generados que ESLint podría analizar durante
    // el `next build` pueden optar por desactivar el lint durante la
    // compilación de producción aquí. Seguimos recomendando ejecutar ESLint
    // localmente o en CI, pero desactivar el lint durante el build evita
    // que los artefactos compilados se traten como código fuente.
    ignoreDuringBuilds: true,
  },
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Ignorar drivers opcionales de TypeORM que se requieren condicionalmente
    // (no se usan en este proyecto y generan advertencias ruidosas durante
    // el build). También silenciar advertencias sobre requires dinámicos
    // usados internamente por TypeORM.
    // Aplicamos IgnorePlugin solo para builds del servidor donde TypeORM se
    // podría incluir en el bundle.
    if (isServer) {
      // Usar createRequire para que esta configuración funcione tanto si
      // Next compila el config como CommonJS o ESM. Esto evita errores
      // "require is not defined" en entornos de build que tratan el config
      // como ESM.
      const require = createRequire(import.meta.url);
      const webpack = require('webpack');

      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp:
            /^(react-native-sqlite-storage|mysql|@sap\/hana-client\/extension\/Stream)$/,
        }),
      );

      config.ignoreWarnings = config.ignoreWarnings || [];
      // Ignorar las advertencias genéricas "the request of a dependency is an expression"
      // provenientes de internals de TypeORM (DirectoryExportedClassesLoader, app-root-path).
      config.ignoreWarnings.push({
        message: /the request of a dependency is an expression/i,
      });

      // Marcar algunos paquetes como externos para el bundle del servidor.
      // Esto evita problemas con TypeORM y reflect-metadata en tiempo de ejecución.
      const existingExternals = config.externals || [];
      if (Array.isArray(existingExternals)) {
        config.externals = [
          ...existingExternals,
          'typeorm',
          'reflect-metadata',
        ];
      } else if (existingExternals) {
        config.externals = [
          existingExternals as any,
          'typeorm',
          'reflect-metadata',
        ];
      } else {
        config.externals = ['typeorm', 'reflect-metadata'];
      }
    }

    return config;
  },
  // Nota: gestionamos la exclusión de paquetes para el bundle del servidor
  // en la función `webpack` (config.externals). Mantener una clave
  // experimental no reconocida provoca advertencias en tiempo de build.
  // Por eso eliminamos `experimental.serverExternalPackages` y confiamos
  // en `webpack externals` para el mismo propósito.
};

export default nextConfig;

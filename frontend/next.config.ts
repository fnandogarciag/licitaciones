// frontend/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Evita que `next build` ejecute ESLint durante la compilación de producción
    // (útil cuando hay artefactos generados en el proyecto). Recomendar
    // ejecutar ESLint en local/CI en lugar de en el build.
    ignoreDuringBuilds: true, // para que next build no corra su lint interno
  },
  reactStrictMode: true,
  // Reenvía (proxy) las solicitudes cliente a /api/* hacia el servicio
  // backend cuando NEXT_PUBLIC_BACKEND_URL está configurado. Evitamos
  // reenviar rutas gestionadas por el frontend (por ejemplo /api/login)
  // para que sigan siendo manejadas por la propia aplicación frontend.
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    if (!backend) return [];
    // Lista permitida de prefijos de API del backend (mantiene /api/login local)
    const backendPrefixes = [
      'procesos',
      'lotes',
      'ofertas',
      'consorcios',
      'empresas',
      'entidades',
      'estado_proceso',
      'fecha_proceso',
      'tipo_fecha_proceso',
      'tipo_proceso',
      'consorcio_empresa',
      'health',
    ];
    return backendPrefixes.map((p) => ({
      source: `/api/${p}/:path*`,
      destination: `${backend}/api/${p}/:path*`,
    }));
  },
};

export default nextConfig;

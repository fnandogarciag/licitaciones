/* eslint-env node */
// Script para verificar que todas las variables de entorno necesarias estén definidas
const requiredEnvVars = [
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'POSTGRES_PORT',
  'FRONTEND_PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASS',
  'DB_NAME',
  'ADMIN_USER',
  'ADMIN_PASSWORD',
];

const missing = requiredEnvVars.filter((v) => !process.env[v]);

if (missing.length > 0) {
  console.error('❌ Faltan las siguientes variables de entorno:');
  missing.forEach((v) => console.error(`   - ${v}`));
  console.error('\nCopia .env.example a .env y configura las variables:');
  console.error('copy .env.example .env');
  process.exit(1);
} else {
  console.log('✅ Variables de entorno OK');
  process.exit(0);
}

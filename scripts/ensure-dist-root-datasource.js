/* eslint-env node */
// Propósito: asegurarse de que en el build final exista un archivo data-source.js
// que simplemente re-exporte ./config/data-source. Esto evita errores en tiempo de ejecución
// cuando alguna parte del código (o librería) intenta require(path.join(process.cwd(),
// 'dist', 'data-source.js')).
const fs = require('fs');
const path = require('path');

const distDir = path.join(process.cwd(), 'dist');
const configPath = path.join(distDir, 'config', 'data-source.js');
const rootPath = path.join(distDir, 'data-source.js');

if (!fs.existsSync(distDir)) {
  // nothing to do if dist doesn't exist yet
  console.warn(
    '[ensure-dist-root-datasource] dist directory does not exist, skipping',
  );
  process.exit(0);
}

if (!fs.existsSync(configPath)) {
  console.warn(
    '[ensure-dist-root-datasource] dist/config/data-source.js not found, skipping',
  );
  process.exit(0);
}

const content = `// Auto-generated to provide a top-level data-source entry for runtime
// (required because some runtime code does require(path.join(process.cwd(), 'dist', 'data-source.js')))
module.exports = require('./config/data-source');\n`;

try {
  fs.writeFileSync(rootPath, content, { encoding: 'utf8' });
  console.log('[ensure-dist-root-datasource] created dist/data-source.js');
} catch (err) {
  console.error(
    '[ensure-dist-root-datasource] failed to write dist/data-source.js',
    err,
  );
  process.exit(1);
}

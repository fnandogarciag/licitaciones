/* eslint-env node */
// Simple script to test database initialization using compiled dist files
const ds = require('../dist/config/data-source');

(async () => {
  try {
    console.log('Starting DB initialize test...');
    await ds.initializeDatabase();
    console.log('DB initialized OK');
    process.exit(0);
  } catch (err) {
    console.error('DB initialize FAILED:', err);
    process.exit(1);
  }
})();

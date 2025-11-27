require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { Pool } = require('pg');

const fromEnv = () => ({
  host: process.env.DBSERVER,
  port: parseInt(process.env.DBPORT, 10) || 5432,
  database: process.env.GAMELIBDB,
  user: process.env.DBUSER_ID,
  password: process.env.DBPASS,
  ssl: { rejectUnauthorized: false }
});

function buildConfig () {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    };
  }
  return fromEnv();
}

function hasMissingConfig (cfg) {
  if (cfg.connectionString) return false;
  return !cfg.host || !cfg.database || !cfg.user || !cfg.password;
}

(async () => {
  const config = buildConfig();

  if (hasMissingConfig(config)) {
    console.error('Missing DB env vars (DBSERVER, DBPORT, GAMELIBDB, DBUSER_ID, DBPASS) or DATABASE_URL.');
    process.exit(1);
  }

  console.log(`Testing Postgres connection to ${process.env.DBSERVER || config.host}:${process.env.DBPORT || config.port} / ${process.env.GAMELIBDB || config.database}`);

  const pool = new Pool(config);

  try {
    const result = await pool.query('SELECT 1 AS ok');
    console.log('Connection successful. Result:', result.rows);
  } catch (error) {
    console.error('Connection failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();

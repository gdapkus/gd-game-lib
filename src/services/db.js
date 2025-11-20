const sql = require('mssql');

const sqlConfig = {
  server: process.env.DBSERVER,
  port: parseInt(process.env.DBPORT, 10) || 1433,
  database: process.env.GAMELIBDB,
  user: process.env.DBUSER_ID,
  password: process.env.DBPASS,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

let poolPromise;

async function getSqlPool () {
  if (!sqlConfig.server || !sqlConfig.database || !sqlConfig.user || !sqlConfig.password) {
    console.warn('SQL config incomplete; skipping DB connection.');
    return null;
  }

  if (!poolPromise) {
    poolPromise = sql.connect(sqlConfig).catch(error => {
      poolPromise = null;
      console.error('SQL connection failed:', error.message);
      throw error;
    });
  }

  return poolPromise;
}

async function fetchUsersFromDb () {
  const pool = await getSqlPool();
  if (!pool) {
    return null;
  }

  const result = await pool.request().query(`
    SELECT
      id AS userid,
      username,
      display_name,
      altname,
      color,
      avatar_url
    FROM dbo.users
    ORDER BY display_name, username;
  `);

  return result.recordset.map(user => ({
    name: user.display_name || user.username,
    username: user.username,
    userid: user.userid,
    altname: user.altname || user.username,
    color: user.color || 'gray',
    avatarUrl: user.avatar_url || ''
  }));
}

module.exports = {
  fetchUsersFromDb
};

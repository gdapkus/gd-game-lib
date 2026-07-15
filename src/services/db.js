const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { getGameDetails } = require('./trelloCards');

let pool;

function buildConfig () {
  if (process.env.DATABASE_URL) {
    // Parse MySQL connection string: mysql://user:pass@host:port/database
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port, 10) || 3306,
      database: url.pathname.substring(1),
      user: url.username,
      password: url.password,
      ssl: url.searchParams.get('ssl') === 'true' ? { rejectUnauthorized: false } : undefined,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
  }

  return {
    host: process.env.DBSERVER,
    port: parseInt(process.env.DBPORT, 10) || 3306,
    database: process.env.GAMELIBDB,
    user: process.env.DBUSER_ID,
    password: process.env.DBPASS,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

function hasConfig (cfg) {
  return cfg.host && cfg.database && cfg.user && cfg.password;
}

function getPool () {
  const config = buildConfig();

  if (!hasConfig(config)) {
    console.warn('MySQL config incomplete; skipping DB connection.');
    return null;
  }

  if (!pool) {
    pool = mysql.createPool(config);
  }

  return pool;
}

async function fetchUsersFromDb () {
  const mysqlPool = getPool();
  if (!mysqlPool) {
    return null;
  }

  try {
    const [rows] = await mysqlPool.query(`
      SELECT
        bgg_userid AS userid,
        username,
        display_name,
        altname,
        color,
        avatar_url
      FROM users
      ORDER BY display_name, username
    `);

    return rows.map(user => ({
      name: user.display_name || user.username,
      username: user.username,
      userid: user.userid,
      altname: user.altname || user.username,
      color: user.color || 'gray',
      avatarUrl: user.avatar_url || ''
    }));
  } catch (error) {
    console.error('Failed to fetch users from MySQL:', error.message);
    return null;
  }
}

async function ensureGamesAndCollections ({ userId, collections, cacheDir = 'public/gameCache', collectionTimestamp }) {
  const mysqlPool = getPool();
  if (!mysqlPool) {
    console.warn('DB unavailable; skipping collections sync.');
    return { gamesUpserted: 0, collectionsUpserted: 0 };
  }

  const toDateOrNull = (value) => {
    if (!value) return null;
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? null : dt;
  };

  const gamesById = new Map();

  async function loadGameDetailsFromCacheOrApi (bggId) {
    if (gamesById.has(bggId)) return gamesById.get(bggId);

    const cachePath = path.join(cacheDir, `${bggId}.json`);
    if (fs.existsSync(cachePath)) {
      try {
        const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        if (cached && cached.gameDetails) {
          const detailsWithSource = { ...cached.gameDetails, sourceTimestamp: cached.timestamp };
          gamesById.set(bggId, detailsWithSource);
          return detailsWithSource;
        }
      } catch (err) {
        console.warn(`Failed to read cache for game ${bggId}: ${err.message}`);
      }
    }

    const { data } = await getGameDetails(bggId);
    if (data) {
      const withSource = { ...data, sourceTimestamp: new Date().toISOString() };
      gamesById.set(bggId, withSource);
      return withSource;
    }

    return null;
  }

  const connection = await mysqlPool.getConnection();
  let gamesUpserted = 0;
  let collectionsUpserted = 0;

  try {
    await connection.beginTransaction();

    for (const entry of collections) {
      const gameDetails = await loadGameDetailsFromCacheOrApi(entry.id);
      if (gameDetails) {
        const bggId = parseInt(gameDetails.id, 10);
        const bestAtCountText = Array.isArray(gameDetails.bestAtCount)
          ? gameDetails.bestAtCount.join(', ')
          : (gameDetails.bestAtCount || null);

        // Convert arrays to JSON for MySQL storage
        const mechanicsJson = Array.isArray(gameDetails.mechanics) ? JSON.stringify(gameDetails.mechanics) : '[]';
        const categoriesJson = Array.isArray(gameDetails.categories) ? JSON.stringify(gameDetails.categories) : '[]';
        const designersJson = Array.isArray(gameDetails.designers) ? JSON.stringify(gameDetails.designers) : '[]';

        const [gameResult] = await connection.query(
          `INSERT INTO games (
            bgg_id, name, postdate, lastmodified, myrating, numplays,
            thumbnail_url, link, min_players, max_players, best_at_count_text,
            playing_time, average_rating, average_weight, boardgame_rank,
            mechanics, categories, designers, source_timestamp
          )
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             postdate = VALUES(postdate),
             lastmodified = VALUES(lastmodified),
             myrating = VALUES(myrating),
             numplays = VALUES(numplays),
             thumbnail_url = VALUES(thumbnail_url),
             link = VALUES(link),
             min_players = VALUES(min_players),
             max_players = VALUES(max_players),
             playing_time = VALUES(playing_time),
             average_rating = VALUES(average_rating),
             average_weight = VALUES(average_weight),
             boardgame_rank = VALUES(boardgame_rank),
             best_at_count_text = VALUES(best_at_count_text),
             mechanics = VALUES(mechanics),
             categories = VALUES(categories),
             designers = VALUES(designers),
             source_timestamp = VALUES(source_timestamp)`,
          [
            bggId,
            gameDetails.name,
            toDateOrNull(entry.postdate),
            toDateOrNull(entry.lastmodified),
            entry.rating ? parseFloat(entry.rating) || null : null,
            entry.numplays ? parseInt(entry.numplays, 10) || 0 : 0,
            gameDetails.thumbnail || null,
            gameDetails.link || null,
            gameDetails.minPlayers ? parseInt(gameDetails.minPlayers, 10) || null : null,
            gameDetails.maxPlayers ? parseInt(gameDetails.maxPlayers, 10) || null : null,
            bestAtCountText,
            gameDetails.playingTime ? parseInt(gameDetails.playingTime, 10) || null : null,
            gameDetails.averageRating ? parseFloat(gameDetails.averageRating) || null : null,
            gameDetails.averageWeight ? parseFloat(gameDetails.averageWeight) || null : null,
            gameDetails.boardGameRank ? parseInt(gameDetails.boardGameRank, 10) || null : null,
            mechanicsJson,
            categoriesJson,
            designersJson,
            toDateOrNull(gameDetails.sourceTimestamp) || new Date()
          ]
        );

        gamesUpserted += gameResult.affectedRows || 0;
        const gameId = bggId;

        await connection.query(
          `INSERT INTO collections (
            collid, bgg_userid, game_id, postdate, lastmodified, numplays,
            own, prevowned, fortrade, want, wanttoplay, wanttobuy, wishlist,
            wishlistpriority, preordered, user_rating, rating_timestamp, source_timestamp
          ) VALUES (
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
          )
          ON DUPLICATE KEY UPDATE
            postdate = VALUES(postdate),
            lastmodified = VALUES(lastmodified),
            numplays = VALUES(numplays),
            own = VALUES(own),
            prevowned = VALUES(prevowned),
            fortrade = VALUES(fortrade),
            want = VALUES(want),
            wanttoplay = VALUES(wanttoplay),
            wanttobuy = VALUES(wanttobuy),
            wishlist = VALUES(wishlist),
            wishlistpriority = VALUES(wishlistpriority),
            preordered = VALUES(preordered),
            user_rating = VALUES(user_rating),
            rating_timestamp = VALUES(rating_timestamp),
            source_timestamp = VALUES(source_timestamp)`,
          [
            parseInt(entry.collid, 10),
            parseInt(userId, 10),
            gameId,
            toDateOrNull(entry.postdate),
            toDateOrNull(entry.lastmodified),
            entry.numplays ? parseInt(entry.numplays, 10) || 0 : 0,
            entry.status?.own || false,
            entry.status?.prevowned || false,
            entry.status?.fortrade || false,
            entry.status?.want || false,
            entry.status?.wanttoplay || false,
            entry.status?.wanttobuy || false,
            entry.status?.wishlist || false,
            typeof entry.status?.wishlistpriority === 'number' ? entry.status.wishlistpriority : (parseInt(entry.status?.wishlistpriority, 10) || null),
            entry.status?.preordered || false,
            entry.rating ? parseFloat(entry.rating) || null : null,
            toDateOrNull(entry.ratingTimestamp),
            toDateOrNull(collectionTimestamp) || new Date()
          ]
        );

        collectionsUpserted += 1;
      }
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error('Failed to upsert collections into DB:', error.message);
    throw error;
  } finally {
    connection.release();
  }

  console.log(`DB sync complete: ${gamesUpserted} games, ${collectionsUpserted} collections.`);
  return { gamesUpserted, collectionsUpserted };
}

module.exports = {
  fetchUsersFromDb,
  ensureGamesAndCollections
};

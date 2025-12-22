const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { getGameDetails } = require('./trelloCards');

let pool;

function buildConfig () {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    };
  }

  return {
    host: process.env.DBSERVER,
    port: parseInt(process.env.DBPORT, 10) || 5432,
    database: process.env.GAMELIBDB,
    user: process.env.DBUSER_ID,
    password: process.env.DBPASS,
    ssl: { rejectUnauthorized: false }
  };
}

function hasConfig (cfg) {
  if (cfg.connectionString) return true;
  return cfg.host && cfg.database && cfg.user && cfg.password;
}

function getPool () {
  const config = buildConfig();

  if (!hasConfig(config)) {
    console.warn('Postgres config incomplete; skipping DB connection.');
    return null;
  }

  if (!pool) {
    pool = new Pool(config);
  }

  return pool;
}

async function fetchUsersFromDb () {
  const pgPool = getPool();
  if (!pgPool) {
    return null;
  }

  try {
    const result = await pgPool.query(`
      SELECT
        bgg_userid AS userid,
        username,
        display_name,
        altname,
        color,
        avatar_url
      FROM public.users
      ORDER BY display_name, username;
    `);

    return result.rows.map(user => ({
      name: user.display_name || user.username,
      username: user.username,
      userid: user.userid,
      altname: user.altname || user.username,
      color: user.color || 'gray',
      avatarUrl: user.avatar_url || ''
    }));
  } catch (error) {
    console.error('Failed to fetch users from Postgres:', error.message);
    return null;
  }
}

async function ensureGamesAndCollections ({ userId, collections, cacheDir = 'public/gameCache', collectionTimestamp }) {
  const pgPool = getPool();
  if (!pgPool) {
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

  const client = await pgPool.connect();
  let gamesUpserted = 0;
  let collectionsUpserted = 0;

  try {
    await client.query('BEGIN');

    for (const entry of collections) {
      const gameDetails = await loadGameDetailsFromCacheOrApi(entry.id);
      if (gameDetails) {
        const bggId = parseInt(gameDetails.id, 10);
        const bestAtCountText = Array.isArray(gameDetails.bestAtCount)
          ? gameDetails.bestAtCount.join(', ')
          : (gameDetails.bestAtCount || null);
        const gameResult = await client.query(
          `INSERT INTO games (
            bgg_id, name, postdate, lastmodified, myrating, numplays,
            thumbnail_url, link, min_players, max_players, best_at_count_text,
            playing_time, average_rating, average_weight, boardgame_rank,
            mechanics, categories, designers, source_timestamp
          )
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
           ON CONFLICT (bgg_id) DO UPDATE SET
             name = EXCLUDED.name,
             postdate = EXCLUDED.postdate,
             lastmodified = EXCLUDED.lastmodified,
             myrating = EXCLUDED.myrating,
             numplays = EXCLUDED.numplays,
             thumbnail_url = EXCLUDED.thumbnail_url,
             link = EXCLUDED.link,
             min_players = EXCLUDED.min_players,
             max_players = EXCLUDED.max_players,
             playing_time = EXCLUDED.playing_time,
             average_rating = EXCLUDED.average_rating,
             average_weight = EXCLUDED.average_weight,
             boardgame_rank = EXCLUDED.boardgame_rank,
             best_at_count_text = EXCLUDED.best_at_count_text,
             mechanics = EXCLUDED.mechanics,
             categories = EXCLUDED.categories,
             designers = EXCLUDED.designers,
             source_timestamp = EXCLUDED.source_timestamp
           RETURNING bgg_id;`,
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
            Array.isArray(gameDetails.mechanics) ? gameDetails.mechanics : [],
            Array.isArray(gameDetails.categories) ? gameDetails.categories : [],
            Array.isArray(gameDetails.designers) ? gameDetails.designers : [],
            toDateOrNull(gameDetails.sourceTimestamp) || new Date()
          ]
        );

        gamesUpserted += gameResult.rowCount || 0;
        const gameId = bggId;

        await client.query(
          `INSERT INTO collections (
            collid, bgg_userid, game_id, postdate, lastmodified, numplays,
            own, prevowned, fortrade, want, wanttoplay, wanttobuy, wishlist,
            wishlistpriority, preordered, user_rating, rating_timestamp, source_timestamp
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
          )
          ON CONFLICT (collid) DO UPDATE SET
            postdate = EXCLUDED.postdate,
            lastmodified = EXCLUDED.lastmodified,
            numplays = EXCLUDED.numplays,
            own = EXCLUDED.own,
            prevowned = EXCLUDED.prevowned,
            fortrade = EXCLUDED.fortrade,
            want = EXCLUDED.want,
            wanttoplay = EXCLUDED.wanttoplay,
            wanttobuy = EXCLUDED.wanttobuy,
            wishlist = EXCLUDED.wishlist,
            wishlistpriority = EXCLUDED.wishlistpriority,
            preordered = EXCLUDED.preordered,
            user_rating = EXCLUDED.user_rating,
            rating_timestamp = EXCLUDED.rating_timestamp,
            source_timestamp = EXCLUDED.source_timestamp;`,
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

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to upsert collections into DB:', error.message);
    throw error;
  } finally {
    client.release();
  }

  console.log(`DB sync complete: ${gamesUpserted} games, ${collectionsUpserted} collections.`);
  return { gamesUpserted, collectionsUpserted };
}

module.exports = {
  fetchUsersFromDb,
  ensureGamesAndCollections
};

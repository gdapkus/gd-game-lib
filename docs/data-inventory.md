# Data Inventory (current filesystem stores)

- **BGG user registry**: `config/bggUsers.json` lists known users (`name`, `username`, `userid`, `altname`, `color`, `avatarUrl`). Used by server routes to drive collection fetches.
- **Per-user collection caches**: `public/gameCache/collectionCache_<username>.json` (e.g., `collectionCache_gdapkus.json`). Shape: `{ timestamp, games: [{ id, collid, name, image, thumbnail, lastmodified, numplays, status{own…}, postdate, rating, ratingTimestamp }] }`. Sourced from BGG collection API via `loadCollection` in `server.js`. Currently 7 files.
- **Per-user rolled-up game caches**: `public/gameCache/gamesCache_<username>.json` aggregates collection entries with detailed game fields for UI delivery; built in `handleGamesRequest` in `server.js` from collection cache + per-game detail files. Shape: `{ timestamp, games: [{ id, name, yearPublished, type, postdate, lastmodified, myrating, numplays, thumbnail, link, minPlayers, maxPlayers, bestAtCount, playingTime, averageRating, averageWeight, boardGameRank, mechanics[], categories[], designers[] }] }`. Currently 7 files.
- **Per-game detail files**: `public/gameCache/<gameId>.json` (~4.5k files). Shape: `{ timestamp, gameDetails: { id, name, type, description, image, thumbnail, link, minPlayers, maxPlayers, yearPublished, playingTime, minPlayingTime, maxPlayingTime, bestAtCount[], averageRating, averageWeight, boardGameRank, mechanics[], categories[], designers[] } }`. Populated by `getGameDetails` calls in `server.js` and `src/services/trelloCards.js`.
- **Raw API responses**: `public/gameCache/rawResponses/collection_<username>_<timestamp>.xml` captures BGG XML when parsing fails (1 file present). Generated in `loadCollection` error path.

Data flow notes:
- `loadCollection(userName)` (server) hits BGG XML API, retries, writes/updates `collectionCache_<username>.json` and keeps timestamps for freshness comparisons.
- `handleGamesRequest` uses collection cache + per-game detail files to build `gamesCache_<username>.json` and serve `/games` endpoints.
- `src/services/trelloCards.js` uses `cacheDir './public/gameCache'` to read per-user collection and per-game detail files when creating Trello cards.
- Env dependency: optional `BGG_API_TOKEN` for collection fetch auth; Trello credentials live in `.env`.

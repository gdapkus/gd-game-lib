# Neon Postgres Schema Plan (draft)

## Goals & constraints
- Persist current filesystem cache data (collection caches, per-game detail files, user registry) in Neon Postgres (v17).
- Preserve existing API contracts to the UI where possible; keep room for future rate-limit-aware refreshes.
- Support incremental refresh and upserts keyed by BGG IDs; avoid duplicating unchanged rows.
- Keep minimal indexes initially (by IDs and usernames); revisit after usage patterns settle.

## Proposed tables (with inline version data on collections)

### users
- `bgg_userid` (int primary key) — BGG user id (`userid`).
- `username` (text, unique).
- `display_name` (text).
- `altname` (text).
- `color` (text).
- `avatar_url` (text).
- Timestamps: `created_at`, `updated_at` (timestamptz).

### collections
- `collid` (bigint primary key) — BGG collection `collid` (one row per entry BGG reports; allows multiple entries per user/game).
- `bgg_userid` (int, FK users.bgg_userid).
- `game_id` (int, FK games.id).
- `copy_index smallint` nullable — placeholder for multiple copies/editions if BGG ever surfaces them (can remain null).
- `edition_note text` nullable — optional future edition/version hint.
- `postdate` (timestamptz, nullable).
- `lastmodified` (timestamptz, nullable).
- `numplays` (int).
- Status flags: `own`, `prevowned`, `fortrade`, `want`, `wanttoplay`, `wanttobuy`, `wishlist`, `wishlistpriority smallint`, `preordered`.
- Ratings: `user_rating numeric(4,2)`, `rating_timestamp timestamptz`.
- `source_timestamp` (timestamptz) — from collection cache `timestamp`.
- Version metadata (inline, nullable) from collection response `<version>`: `version_id int`, `version_name text`, `version_canonical_name text`, `version_year int`, `version_image_url text`, `version_thumbnail_url text`, `version_productcode text`, `version_language text`.
- Indexes: PK on `collid`; non-unique index on (`bgg_userid`, `game_id`) to support lookups and an “all games” rollup that may dedup by `game_id`.

### games
- `bgg_id` (int primary key) — matches JSON `id`.
- `name` (text).
- `type` (text).
- `year_published` (int nullable).
- Artwork/links: `thumbnail_url` (text), `link` (text).
- Player counts/times: `min_players`, `max_players`, `playing_time`, `min_playing_time`, `max_playing_time` (int).
- Ratings/meta: `average_rating numeric(5,3)`, `average_weight numeric(4,3)`, `boardgame_rank int`.
- `best_at_count_text` (text) — from JSON bestAtCount; normalize later if needed.
- Arrays: `mechanics text[]`, `categories text[]`, `designers text[]`.
- Collection-adjacent fields often present in rolled-up JSON (optional here if kept only in collections): `postdate timestamptz`, `lastmodified timestamptz`, `myrating numeric(4,2)`, `numplays int`.
- Timestamps: `source_timestamp` (timestamptz) from per-game file `timestamp`; `last_fetched_at` (timestamptz) when scraped.

### game_mechanics
- `game_id` (int, FK games.id).
- `mechanic` (text).
- PK on (`game_id`, `mechanic`).

### game_categories
- `game_id` (int, FK games.id).
- `category` (text).
- PK on (`game_id`, `category`).

### game_designers
- `game_id` (int, FK games.id).
- `designer` (text).
- PK on (`game_id`, `designer`).

## Notes for migration script
- Upsert order: users → games (and mechanics/categories/designers) → collections.
- Use batching for per-game detail inserts to handle ~4.5k files.
- Store `source_timestamp` to compare freshness against BGG; keep `last_fetched_at` for operational monitoring.
- Retain `collid` in collections for traceability to BGG collection entries; do not dedupe on (`user_id`, `game_id`) so multiple copies are preserved.
- For UI “all games” view, serve distinct `game_id` rows (e.g., via view or query) while still allowing multiple collection entries underneath; optionally return counts if needed.

## Environment variables (split, no full connection string)
- `DBSERVER` — e.g., `ep-square-lab-aaj29kfy-pooler.westus3.azure.neon.tech`
- `DBPORT` — e.g., `5432`
- `GAMELIBDB` — e.g., `gamesdb`
- `DBUSER_ID` — database user
- `DBPASS` — database password (keep in local .env only)
- Optional: `DATABASE_URL` — full Postgres URL (pooler), with `sslmode=require`.

## Next steps
- Review schema names/types; align with Postgres defaults and current implementation.
- Draft migration script to read current JSON files and populate tables with upserts.
- Update `server.js` service layer to read from Postgres instead of filesystem, preserving API responses.
- Add caching strategy (server/browser) to reduce DB load once endpoints are live.

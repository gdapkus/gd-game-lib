# Azure SQL Schema Plan (draft)

## Goals & constraints
- Persist current filesystem cache data (collection caches, per-game detail files, user registry) in Azure SQL.
- Preserve existing API contracts to the UI where possible; keep room for future rate-limit-aware refreshes.
- Support incremental refresh and upserts keyed by BGG IDs; avoid duplicating unchanged rows.
- Keep minimal indexes initially (by IDs and usernames); revisit after usage patterns settle.

## Proposed tables (with inline version data on collections)

### users
- `id` (int, PK) — BGG user id (`userid`).
- `username` (nvarchar, unique).
- `display_name` (nvarchar).
- `altname` (nvarchar).
- `color` (nvarchar(32)).
- `avatar_url` (nvarchar(max)).
- Timestamps: `created_at`, `updated_at` (datetimeoffset).

### collections
- `id` (bigint, PK) — BGG collection `collid` (one row per entry BGG reports; allows multiple entries per user/game).
- `user_id` (int, FK users.id).
- `game_id` (int, FK games.id).
- `copy_index smallint` nullable — placeholder for multiple copies/editions if BGG ever surfaces them (can remain null).
- `edition_note nvarchar(256)` nullable — optional future edition/version hint.
- `postdate` (datetimeoffset, nullable).
- `lastmodified` (datetimeoffset, nullable).
- `numplays` (int).
- Status flags: `own`, `prevowned`, `fortrade`, `want`, `wanttoplay`, `wanttobuy`, `wishlist`, `wishlistpriority` (smallint nullable), `preordered`.
- Ratings: `user_rating` (decimal(4,2) nullable), `rating_timestamp` (datetimeoffset nullable).
- `source_timestamp` (datetimeoffset) — from collection cache `timestamp`.
- Version metadata (inline, nullable) from collection response `<version>`: `version_id int`, `version_name nvarchar(256)`, `version_canonical_name nvarchar(256)`, `version_year int`, `version_image_url nvarchar(max)`, `version_thumbnail_url nvarchar(max)`, `version_productcode nvarchar(64)`, `version_language nvarchar(64)`.
- Indexes: PK on `id`; non-unique index on (`user_id`, `game_id`) to support lookups and an “all games” rollup that may dedup by `game_id`.

### games
- `id` (int, PK) — BGG game id.
- `name` (nvarchar).
- `type` (nvarchar(64)).
- `year_published` (int nullable).
- `description` (nvarchar(max)).
- `image_url` (nvarchar(max)).
- `thumbnail_url` (nvarchar(max)).
- `link` (nvarchar(max)).
- Player counts/times: `min_players`, `max_players`, `playing_time`, `min_playing_time`, `max_playing_time` (int).
- Ratings/meta: `average_rating` (decimal(5,3)), `average_weight` (decimal(4,3)), `boardgame_rank` (int nullable).
- `best_at_count_text` (nvarchar(64)) — or normalized if needed later.
- `source_timestamp` (datetimeoffset) — from per-game file `timestamp`.
- `last_fetched_at` (datetimeoffset) — when scraped from BGG.

### game_mechanics
- `game_id` (int, FK games.id).
- `mechanic` (nvarchar(128)).
- PK on (`game_id`, `mechanic`).

### game_categories
- `game_id` (int, FK games.id).
- `category` (nvarchar(128)).
- PK on (`game_id`, `category`).

### game_designers
- `game_id` (int, FK games.id).
- `designer` (nvarchar(128)).
- PK on (`game_id`, `designer`).

## Notes for migration script
- Upsert order: users → games (and mechanics/categories/designers) → collections.
- Use batching for per-game detail inserts to handle ~4.5k files.
- Store `source_timestamp` to compare freshness against BGG; keep `last_fetched_at` for operational monitoring.
- Retain `collid` in collections for traceability to BGG collection entries; do not dedupe on (`user_id`, `game_id`) so multiple copies are preserved.
- For UI “all games” view, serve distinct `game_id` rows (e.g., via view or query) while still allowing multiple collection entries underneath; optionally return counts if needed.

## Environment variables (split, no full connection string)
- `DBSERVER` — e.g., `gamesdb.database.windows.net`
- `DBPORT` — e.g., `1433`
- `GAMELIBDB` — e.g., `GameLibrary`
- `DBUSER_ID` — database user
- `DBPASS` — database password (keep in local .env only)

## Next steps
- Review schema names/types; adjust precision/nullable choices.
- Draft migration script to read current JSON files and populate tables with upserts.
- Update `server.js` service layer to read from SQL instead of filesystem, preserving API responses.***
\ No newline at end of file

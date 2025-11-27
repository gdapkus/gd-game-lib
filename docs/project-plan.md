# Project Plan (agent-loaded)

## Purpose & Use
- Single source for priorities, backlog, and decisions. Keep current; agents read this before working.
- Update sections as work progresses; add date-stamped notes under Update Log.

## Active Initiatives
- **Verify update collection process and filtering** — In progress
  - Goal: Confirm the updated collection process loads all games and that the filtering in `Games.vue` and `GamesCompact.vue` defaults to owned games correctly.
  - Current: Update collection process now loads all games. `Games.vue` and `GamesCompact.vue` include a filter for owned games by default. JSON file output has been updated to include game status. These changes are currently untested.
  - Next steps: Develop and execute tests to verify functionality and data integrity.
- **Migrate filesystem caches to Neon Postgres** — In progress
  - Goal: replace `public/gameCache` reads with SQL queries while preserving API responses.
  - Current: Postgres (Neon) reachable via env (`DBSERVER`, `DBPORT`, `GAMELIBDB`, `DBUSER_ID`, `DBPASS`); `/api/bgg-users` reads from DB with JSON fallback. Collections/games upserts now succeed after aligning the games column set, adding collection status/rating columns, and sanitizing timestamps; filesystem caches are still the primary read path.
  - Next steps: migrate collections/games endpoints off filesystem caches; draft migration script to load JSON data into Postgres.
  - References: `docs/neon-postgres-schema-plan.md`, `docs/data-inventory.md`.
- **(Add next initiative here)** — Status/next step/link

## Near-Term Queue (up next)
- [ ] Wire collections/games API endpoints to Postgres and remove dependency on `public/gameCache`.
- [ ] Add browser-side caching for key API payloads (users, collections) with TTL/invalidation to cut DB calls.
- [ ] Filter by playtime — slider 0–180+ minutes in 15-minute increments.
- [ ] Combined collections view — include all or selected users; depends on DB migration.
- [ ] Status filter (defaults to OWN only).
- [ ] Wishlist view to show wishlist ordered by priority ascending.
- [ ] Recommendations — longer-term; explore AI-assisted suggestions.
- [ ] Hide/disable “Update Collection” on the public site; make refresh a backend/admin-only action.

## Known Bugs / Issues
- [ ] White initial page load renders on white background; should be black.
- [ ] trello card creation need to be fixed so that "owned' label is only applied if the game is Owned by a user, not just in their collections

## Decisions & Open Questions
- BGG API queues/throttles collection/detail requests; keep existing retry/backoff delays and avoid rapid bursts of calls when refreshing collections or missing game files.
- Do not change what data is fetched from BGG or how it is collected (requests, fields, timing) until we explicitly revisit the ingestion plan.
- Env vars are split for DB connection; no full connection string in repo.
- **Database Standard:** The project has standardized on Neon Postgres. All new database development and migration efforts should use the project's existing Neon Postgres instance. Implementation should follow the patterns in `src/services/db.js`, using the `pg` library.
- Caching: current plan is to move off `public/gameCache`; confirm whether to retain any filesystem cache as fallback.
- Add client-side caching: cache frequently-used API payloads (e.g., `/api/bgg-users`, collections) in the browser to reduce DB calls; define invalidation/TTL.
- User records are created only via manual updates to DB/JSON; no automated user creation processes.

## References
- Schema/migration plan: `docs/neon-postgres-schema-plan.md`
- Current filesystem data map: `docs/data-inventory.md`

## Update Log
- 2025-11-26: Added new active initiative to verify updated collection process and filtering, including changes to Games.vue, GamesCompact.vue, and JSON output for game status.
- 2025-11-25: Fixed Neon insert issues (games column alignment, added collection status/rating columns, timestamp sanitization). Collection refresh now populates DB successfully; next focus is serving collections/games from DB instead of filesystem caches.
- 2025-11-24: Switched plan to Neon Postgres, noted users endpoint using DB with JSON fallback, added browser caching focus and upcoming collections/games migration.
- 2025-01-08: Created project plan scaffold.

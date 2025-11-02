# Repository Guidelines

## Project Structure & Module Organization
The client lives under `src/`, with `main.js` bootstrapping Vue 3 and Vuetify. View wrappers are in `src/pages/`, reusable UI in `src/components/`, and cross-cutting helpers in `src/services/` and `src/plugins/`. Global styles sit in `src/styles/`, while static assets (icons, mock images) belong in `src/assets/`. The Express helper server runs from `server.js` and reads configuration from `config/`. Vite output is emitted to `dist/`, which should stay generated.

## Build, Test, and Development Commands
- `npm run dev`: runs Vite and the Node proxy together via `concurrently`; use for end-to-end local work.
- `npm run devv`: Vite-only preview when the API layer is not required.
- `npm run build`: creates a production bundle in `dist/`.
- `npm run preview`: serves the built bundle for manual smoke testing.
- `npm run lint`: applies the ESLint standard + Vue ruleset to the entire project.
- `node testVideoScraper.js`: ad-hoc check for the scraping helper before wiring it into the UI.

## Coding Style & Naming Conventions
Use two-space indentation for Vue, JS, and JSON files. Prefer single quotes in scripts and double quotes inside templates to align with ESLint defaults. Components and pages should be PascalCase (`GameList.vue`, `LibraryDashboard.vue`), while services and utilities stay camelCase. Keep composables or script helpers colocated with their feature directory when possible. Run `npm run lint` before pushing; do not bypass lint fixers in CI.

## Testing Guidelines
No automated framework is in place yet; when adding one, prefer Vitest to match the Vite toolchain. Until then, cover new logic with targeted Node scripts (mirroring `testVideoScraper.js`) and document manual test flows in the pull request. When adding tests, mirror the `FeatureName.spec.js` pattern under a future `tests/` directory and ensure they can be invoked via `npm test`.

## Commit & Pull Request Guidelines
Existing commits are short, imperative lines (e.g., `Library Update Goo fix`); continue that style, keeping the first line under 72 characters and scoping changes narrowly. Reference issue IDs when available using `feat:` or `fix:` prefixes only if they add clarity. Pull requests should include: a concise summary, screenshots or GIFs for UI changes, a list of manual or scripted tests executed, and notes about configuration or schema updates. Request review from another contributor before merging; avoid force pushes after review unless you coordinate.

## Security & Configuration Tips
Secrets and API keys belong in a local `.env` consumed by `dotenv` in `server.js`; never commit them. Update `config/bggUsers.json` only with sanitized user IDs, and document any new external endpoints touched by scrapers to keep operators aware of rate limits.

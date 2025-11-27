# MyGameLibrary

## Project Summary
MyGameLibrary is a web application designed to help users manage and explore their personal board game collections. It integrates with BoardGameGeek (BGG) to fetch game data and provides a user-friendly interface to browse, filter, and track owned games.

## Key Features
*   View and manage your personal board game collection.
*   Fetch and update game data from BoardGameGeek.
*   Filter and sort games based on various criteria.
*   Database-backed persistence for game and collection data.
*   Trello integration for managing game-related tasks.

## Technology Stack
*   **Frontend:** Vue.js 3, Vuetify 3, Pinia (State Management), Vue Router.
*   **Backend:** Node.js, Express.js.
*   **Database:** Neon Postgres.
*   **Tooling:** Vite, ESLint.

## Getting Started

### Prerequisites
Ensure you have the following installed:
*   Node.js (LTS recommended)
*   npm or Yarn (or pnpm, bun)

### Installation & Setup
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/MyGameLibrary.git
    cd MyGameLibrary
    ```
2.  **Install dependencies:**
    ```bash
    npm install  # or yarn install, pnpm install, bun install
    ```
3.  **Environment Variables:**
    Create a `.env` file in the root directory by copying `.env.example` and filling in the required values.

    Example `.env` configuration:
    ```
    # Express Server Port
    EXPRESS_PORT=5000

    # BGG API Token (Optional, for higher rate limits if available)
    BGG_API_TOKEN=your_bgg_api_token_here

    # Trello API Credentials (for Trello integration)
    TRELLO_KEY=your_trello_api_key_here
    TRELLO_TOKEN=your_trello_api_token_here

    # Neon Postgres Database Configuration
    # Option 1: Use a full connection string (recommended for deployment)
    # DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
    # Option 2: Individual connection parameters (for local development)
    DBSERVER=your_db_host_here
    DBPORT=5432
    GAMELIBDB=your_db_name_here
    DBUSER_ID=your_db_user_here
    DBPASS=your_db_password_here
    ```
    Refer to `docs/neon-postgres-schema-plan.md` for more details on database connection parameters.

## Running the Application

*   `npm run dev`: Runs the Vite frontend and Node.js backend concurrently. Use this for most development work.
*   `npm run devv`: Runs the Vite frontend only, for UI work that doesn't require the API.
*   `npm run build`: Creates a production-ready build in the `dist/` directory.
*   `npm run preview`: Serves the production build locally for testing.
*   `npm run lint`: Lints and formats the entire project.
*   `node testVideoScraper.js`: Runs an ad-hoc test for the video scraping helper.

## Developer Guidelines

### Project Structure
*   **`src/`**: Contains the Vue.js frontend application.
    *   **`pages/`**: View components that act as page wrappers.
    *   **`components/`**: Reusable UI components.
    *   **`services/`**: Cross-cutting helpers and utilities.
    *   **`plugins/`**: Global Vue plugins.
    *   **`assets/`**: Static assets like icons and images.
*   **`server.js`**: The main file for the Express backend server.
*   **`config/`**: Configuration files read by the server.
*   **`dist/`**: The output directory for production builds (auto-generated).

### Coding Style & Naming Conventions
*   **Indentation:** Use two-space indentation for all Vue, JS, and JSON files.
*   **Quotes:** Prefer single quotes in scripts (`.js`, `.mjs`) and double quotes inside Vue templates.
*   **File Naming:**
    *   Vue components and pages should be `PascalCase` (e.g., `GameList.vue`, `LibraryDashboard.vue`).
    *   Services, utilities, and scripts should be `camelCase`.
*   **Linting:** Run `npm run lint` before committing changes.

### Testing Guidelines
*   No automated framework is in place yet. The plan is to add Vitest to match the Vite toolchain.
*   Until then, new logic should be covered with targeted Node.js scripts, similar to `testVideoScraper.js`.

### Commit & Pull Request Guidelines
*   **Commit Messages:** Keep messages short and in the imperative mood (e.g., "Fix game list sorting bug"). The first line should be under 72 characters.
*   **Scope:** Keep changes narrowly scoped to a single feature or bug fix.

### Security & Configuration
*   All secrets, API keys, and passwords must be stored in a local `.env` file and never committed to the repository.

## Project Documentation
For more in-depth information about the project, please refer to these documents:

*   **Project Plan & Roadmap:** [`docs/project-plan.md`](./docs/project-plan.md)
*   **Database Schema Plan:** [`docs/neon-postgres-schema-plan.md`](./docs/neon-postgres-schema-plan.md)
*   **Data Inventory (Filesystem Sources):** [`docs/data-inventory.md`](./docs/data-inventory.md)
*   **Agent Guidelines (for AI collaborators):** [`AGENTS.md`](./AGENTS.md)
*   **Gemini AI Specific Notes:** [`gemini.md`](./gemini.md)

## License
MIT

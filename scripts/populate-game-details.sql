-- scripts/populate-game-details.sql

-- Create game_mechanics table
CREATE TABLE IF NOT EXISTS game_mechanics (
    game_id INTEGER REFERENCES games(bgg_id),
    mechanic TEXT,
    PRIMARY KEY (game_id, mechanic)
);

-- Create game_categories table
CREATE TABLE IF NOT EXISTS game_categories (
    game_id INTEGER REFERENCES games(bgg_id),
    category TEXT,
    PRIMARY KEY (game_id, category)
);

-- Create game_designers table
CREATE TABLE IF NOT EXISTS game_designers (
    game_id INTEGER REFERENCES games(bgg_id),
    designer TEXT,
    PRIMARY KEY (game_id, designer)
);

-- Populate game_mechanics table
INSERT INTO game_mechanics (game_id, mechanic)
SELECT
    g.bgg_id AS game_id,
    UNNEST(g.mechanics) AS mechanic
FROM
    games g
WHERE
    g.mechanics IS NOT NULL
ON CONFLICT (game_id, mechanic) DO NOTHING;

-- Populate game_categories table
INSERT INTO game_categories (game_id, category)
SELECT
    g.bgg_id AS game_id,
    UNNEST(g.categories) AS category
FROM
    games g
WHERE
    g.categories IS NOT NULL
ON CONFLICT (game_id, category) DO NOTHING;

-- Populate game_designers table
INSERT INTO game_designers (game_id, designer)
SELECT
    g.bgg_id AS game_id,
    UNNEST(g.designers) AS designer
FROM
    games g
WHERE
    g.designers IS NOT NULL
ON CONFLICT (game_id, designer) DO NOTHING;

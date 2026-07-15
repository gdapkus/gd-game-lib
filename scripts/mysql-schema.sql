-- MySQL Schema for MyGameLibrary
-- Converted from Neon Postgres schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  bgg_userid INT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  altname VARCHAR(255),
  color VARCHAR(50),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Games table
CREATE TABLE IF NOT EXISTS games (
  bgg_id INT PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  type VARCHAR(100),
  year_published INT,
  thumbnail_url TEXT,
  link TEXT,
  min_players INT,
  max_players INT,
  playing_time INT,
  min_playing_time INT,
  max_playing_time INT,
  average_rating DECIMAL(5,3),
  average_weight DECIMAL(4,3),
  boardgame_rank INT,
  best_at_count_text VARCHAR(255),
  -- Arrays stored as JSON in MySQL
  mechanics JSON,
  categories JSON,
  designers JSON,
  -- Collection-adjacent fields
  postdate TIMESTAMP NULL,
  lastmodified TIMESTAMP NULL,
  myrating DECIMAL(4,2),
  numplays INT DEFAULT 0,
  source_timestamp TIMESTAMP NULL,
  last_fetched_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  collid BIGINT PRIMARY KEY,
  bgg_userid INT NOT NULL,
  game_id INT NOT NULL,
  copy_index SMALLINT,
  edition_note TEXT,
  postdate TIMESTAMP NULL,
  lastmodified TIMESTAMP NULL,
  numplays INT DEFAULT 0,
  -- Status flags (MySQL BOOLEAN is alias for TINYINT(1))
  own BOOLEAN DEFAULT FALSE,
  prevowned BOOLEAN DEFAULT FALSE,
  fortrade BOOLEAN DEFAULT FALSE,
  want BOOLEAN DEFAULT FALSE,
  wanttoplay BOOLEAN DEFAULT FALSE,
  wanttobuy BOOLEAN DEFAULT FALSE,
  wishlist BOOLEAN DEFAULT FALSE,
  wishlistpriority SMALLINT,
  preordered BOOLEAN DEFAULT FALSE,
  -- Ratings
  user_rating DECIMAL(4,2),
  rating_timestamp TIMESTAMP NULL,
  source_timestamp TIMESTAMP NULL,
  -- Version metadata (inline, nullable)
  version_id INT,
  version_name VARCHAR(500),
  version_canonical_name VARCHAR(500),
  version_year INT,
  version_image_url TEXT,
  version_thumbnail_url TEXT,
  version_productcode VARCHAR(255),
  version_language VARCHAR(100),
  -- Foreign keys
  FOREIGN KEY (bgg_userid) REFERENCES users(bgg_userid) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(bgg_id) ON DELETE CASCADE,
  -- Indexes
  INDEX idx_collections_user_game (bgg_userid, game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Normalized game detail tables (optional, for complex queries)

CREATE TABLE IF NOT EXISTS game_mechanics (
  game_id INT NOT NULL,
  mechanic VARCHAR(255) NOT NULL,
  PRIMARY KEY (game_id, mechanic),
  FOREIGN KEY (game_id) REFERENCES games(bgg_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_categories (
  game_id INT NOT NULL,
  category VARCHAR(255) NOT NULL,
  PRIMARY KEY (game_id, category),
  FOREIGN KEY (game_id) REFERENCES games(bgg_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_designers (
  game_id INT NOT NULL,
  designer VARCHAR(255) NOT NULL,
  PRIMARY KEY (game_id, designer),
  FOREIGN KEY (game_id) REFERENCES games(bgg_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Additional indexes for common queries

CREATE INDEX idx_games_name ON games(name(255));
CREATE INDEX idx_games_rank ON games(boardgame_rank);
CREATE INDEX idx_games_rating ON games(average_rating);
CREATE INDEX idx_collections_user ON collections(bgg_userid);
CREATE INDEX idx_collections_game ON collections(game_id);
CREATE INDEX idx_collections_own ON collections(own);

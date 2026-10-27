-- App tables. Better Auth manages its own tables ("user", "session", "account", "verification").

CREATE TABLE IF NOT EXISTS games (
  id              SERIAL PRIMARY KEY,
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('video', 'board', 'card')),
  tagline         TEXT,
  description     TEXT,
  aliases         TEXT[] NOT NULL DEFAULT '{}',
  genres          TEXT[] NOT NULL DEFAULT '{}',
  platforms       TEXT[] NOT NULL DEFAULT '{}',
  developer       TEXT,
  publisher       TEXT,
  release_year    INT,
  players         TEXT,
  play_time       TEXT,
  age             TEXT,
  is_continuous   BOOLEAN NOT NULL DEFAULT false,
  featured        BOOLEAN NOT NULL DEFAULT false,
  hue             INT NOT NULL DEFAULT 265,
  hltb_query      TEXT,
  hltb_id         INT,
  hltb_name       TEXT,
  hltb_main       REAL,
  hltb_extra      REAL,
  hltb_complete   REAL,
  hltb_checked_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS games_category_idx ON games (category);

CREATE TABLE IF NOT EXISTS wiki_sections (
  id          SERIAL PRIMARY KEY,
  game_id     INT NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  title       TEXT NOT NULL,
  icon        TEXT,
  summary     TEXT,
  content     TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  UNIQUE (game_id, slug)
);

CREATE TABLE IF NOT EXISTS glossary_terms (
  id          SERIAL PRIMARY KEY,
  section_id  INT NOT NULL REFERENCES wiki_sections (id) ON DELETE CASCADE,
  term        TEXT NOT NULL,
  definition  TEXT NOT NULL,
  grp         TEXT,
  sort_order  INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS glossary_section_idx ON glossary_terms (section_id);

CREATE TABLE IF NOT EXISTS user_games (
  user_id     TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  game_id     INT NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  status      TEXT NOT NULL,
  rating      INT CHECK (rating BETWEEN 1 AND 10),
  hours       REAL CHECK (hours >= 0),
  notes       TEXT,
  favorite    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game_id)
);

CREATE TABLE IF NOT EXISTS game_views (
  user_id    TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  game_id    INT NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game_id)
);

CREATE TABLE IF NOT EXISTS friendships (
  id            SERIAL PRIMARY KEY,
  requester_id  TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  addressee_id  TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at  TIMESTAMPTZ,
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

CREATE TABLE IF NOT EXISTS forum_threads (
  id            SERIAL PRIMARY KEY,
  game_id       INT REFERENCES games (id) ON DELETE SET NULL,
  author_id     TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  reply_count   INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_post_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS forum_threads_game_idx ON forum_threads (game_id, last_post_at DESC);

CREATE TABLE IF NOT EXISTS forum_posts (
  id          SERIAL PRIMARY KEY,
  thread_id   INT NOT NULL REFERENCES forum_threads (id) ON DELETE CASCADE,
  author_id   TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activities (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  game_id     INT REFERENCES games (id) ON DELETE CASCADE,
  thread_id   INT REFERENCES forum_threads (id) ON DELETE CASCADE,
  status      TEXT,
  meta        JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activities_user_idx ON activities (user_id, created_at DESC);

-- Steam integration: artwork + patch notes (video games only for patch notes).
ALTER TABLE games ADD COLUMN IF NOT EXISTS steam_appid INT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS capsule_url TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS hero_url TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS header_url TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS steam_assets_checked_at TIMESTAMPTZ;
ALTER TABLE games ADD COLUMN IF NOT EXISTS current_version TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS last_update_at TIMESTAMPTZ;
ALTER TABLE games ADD COLUMN IF NOT EXISTS news_checked_at TIMESTAMPTZ;
ALTER TABLE games ADD COLUMN IF NOT EXISTS patch_exclude TEXT;

CREATE TABLE IF NOT EXISTS game_updates (
  id            SERIAL PRIMARY KEY,
  game_id       INT NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  gid           TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  url           TEXT,
  author        TEXT,
  version       TEXT,
  content       TEXT,
  published_at  TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS game_updates_game_idx ON game_updates (game_id, published_at DESC);

-- Fandom (MediaWiki) integration.
ALTER TABLE games ADD COLUMN IF NOT EXISTS fandom_wiki TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS fandom_page TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS fandom_topics TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS fandom_cache (
  key         TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Game reviews: one per user per game, scored 1-10.
CREATE TABLE IF NOT EXISTS reviews (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  game_id     INT NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  score       INT NOT NULL CHECK (score BETWEEN 1 AND 10),
  body        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);
CREATE INDEX IF NOT EXISTS reviews_game_idx ON reviews (game_id, updated_at DESC);

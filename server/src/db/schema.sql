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

-- Content pipeline: games added through the admin API are owned by the database
-- ('api'); the startup seed sync only touches games it owns ('seed').
ALTER TABLE games ADD COLUMN IF NOT EXISTS managed_by TEXT NOT NULL DEFAULT 'seed';
DO $$ BEGIN
  ALTER TABLE games ADD CONSTRAINT games_managed_by_check CHECK (managed_by IN ('seed', 'api'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Every change made through the admin API, for accountability.
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          SERIAL PRIMARY KEY,
  actor       TEXT NOT NULL,
  action      TEXT NOT NULL,
  game_slug   TEXT,
  details     JSONB NOT NULL DEFAULT '{}',
  ip          TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx ON admin_audit_log (created_at DESC);

-- Steam store data for video games: the current price (refreshed every few hours,
-- since Steam runs frequent sales) and the game's DLC.
ALTER TABLE games ADD COLUMN IF NOT EXISTS price_currency TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS price_initial INT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS price_final INT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS price_discount INT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_free BOOLEAN;
ALTER TABLE games ADD COLUMN IF NOT EXISTS store_checked_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS game_dlc (
  id              SERIAL PRIMARY KEY,
  game_id         INT NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  appid           INT NOT NULL,
  name            TEXT NOT NULL,
  kind            TEXT NOT NULL DEFAULT 'dlc',
  description     TEXT,
  header_url      TEXT,
  release_date    TEXT,
  released_on     DATE,
  coming_soon     BOOLEAN NOT NULL DEFAULT false,
  is_free         BOOLEAN NOT NULL DEFAULT false,
  price_currency  TEXT,
  price_initial   INT,
  price_final     INT,
  price_discount  INT,
  checked_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, appid)
);

-- Board and card game expansions: synced from BoardGameGeek (source 'bgg') when the
-- game has a bgg_id and BGG_API_TOKEN is set, or listed by hand in the game's JSON ('manual').
ALTER TABLE games ADD COLUMN IF NOT EXISTS bgg_id INT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS bgg_checked_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS game_expansions (
  id           SERIAL PRIMARY KEY,
  game_id      INT NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  source       TEXT NOT NULL CHECK (source IN ('bgg', 'manual')),
  bgg_id       INT,
  name         TEXT NOT NULL,
  year         INT,
  description  TEXT,
  image_url    TEXT,
  url          TEXT,
  popularity   INT NOT NULL DEFAULT 0,
  sort_order   INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS game_expansions_game_idx ON game_expansions (game_id);
CREATE UNIQUE INDEX IF NOT EXISTS game_expansions_bgg_idx ON game_expansions (game_id, bgg_id) WHERE source = 'bgg';

-- A game's own wiki when it has no Fandom wiki (wiki_url, set from the add-game
-- scripts). wiki_info holds what the server found there: its MediaWiki API, its
-- license, and whether that license lets us republish it ("embeddable").
ALTER TABLE games ADD COLUMN IF NOT EXISTS wiki_url TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS wiki_info JSONB;

-- Article titles of every game's wiki, so site-wide search finds wiki pages
-- (characters, items, places...). Keyed by wiki, not game: games can share a wiki.
CREATE TABLE IF NOT EXISTS wiki_titles (
  wiki   TEXT NOT NULL,
  title  TEXT NOT NULL,
  PRIMARY KEY (wiki, title)
);
-- Lowercased, accent-free title (so "alvarez" finds "Judy Álvarez"); filled by lib/wikiSync.js.
ALTER TABLE wiki_titles ADD COLUMN IF NOT EXISTS norm TEXT;
CREATE TABLE IF NOT EXISTS wiki_index_state (
  wiki        TEXT PRIMARY KEY,
  titles      INT NOT NULL DEFAULT 0,
  error       TEXT,
  indexed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Trigram index for "contains" searches; skipped where pg_trgm isn't installed.
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  DROP INDEX IF EXISTS wiki_titles_trgm_idx;
  CREATE INDEX IF NOT EXISTS wiki_titles_norm_trgm_idx ON wiki_titles USING gin (norm gin_trgm_ops);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pg_trgm unavailable: wiki title search will scan';
END $$;

-- Files and rulebook content sent with a game (see the add-game scripts). thumbnail_url
-- replaces the game's art; rulebook_tldr is [{ heading, points[] }]; faq_url links to a site with the game's FAQs.
ALTER TABLE games ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
-- Replaces the banner across the top of the game page.
ALTER TABLE games ADD COLUMN IF NOT EXISTS banner_url TEXT;
-- A game's rulebooks in order: [{ name, url }]. The one named "Base Game" is the page's main rulebook.
ALTER TABLE games ADD COLUMN IF NOT EXISTS rulebooks JSONB NOT NULL DEFAULT '[]';
-- Games used to have one rulebook; it becomes their Base Game rulebook.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'games' AND column_name = 'rulebook_url') THEN
    UPDATE games SET rulebooks = jsonb_build_array(jsonb_build_object('name', 'Base Game', 'url', rulebook_url))
      WHERE rulebook_url IS NOT NULL AND rulebooks = '[]';
    ALTER TABLE games DROP COLUMN rulebook_url;
  END IF;
END $$;
ALTER TABLE games ADD COLUMN IF NOT EXISTS rulebook_tldr JSONB NOT NULL DEFAULT '[]';
ALTER TABLE games ADD COLUMN IF NOT EXISTS faq_url TEXT;
ALTER TABLE games DROP COLUMN IF EXISTS faq;
-- Questions the linked FAQ doesn't cover, written for the site: [{ q, a }].
ALTER TABLE games ADD COLUMN IF NOT EXISTS unique_faq JSONB NOT NULL DEFAULT '[]';

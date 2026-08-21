PRAGMA foreign_keys = ON;

CREATE TABLE products (
	id TEXT PRIMARY KEY,
	canonical_url TEXT NOT NULL UNIQUE,
	domain TEXT NOT NULL,
	favicon_url TEXT NOT NULL,
	total_paid_sen INTEGER NOT NULL DEFAULT 0 CHECK (total_paid_sen >= 0),
	settlement_sequence INTEGER,
	status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active')),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contributors (
	id TEXT PRIMARY KEY,
	email_hash TEXT NOT NULL UNIQUE,
	email_domain TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contributions (
	id TEXT PRIMARY KEY,
	product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	contributor_id TEXT NOT NULL REFERENCES contributors(id) ON DELETE RESTRICT,
	amount_sen INTEGER NOT NULL CHECK (amount_sen >= 100),
	currency TEXT NOT NULL DEFAULT 'myr' CHECK (currency = 'myr'),
	stripe_session_id TEXT UNIQUE,
	stripe_payment_intent_id TEXT UNIQUE,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'expired')),
	settlement_sequence INTEGER,
	settled_at TEXT,
	applied_at TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE webhook_events (
	sequence INTEGER PRIMARY KEY AUTOINCREMENT,
	stripe_event_id TEXT NOT NULL UNIQUE,
	event_type TEXT NOT NULL,
	processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX products_leaderboard_idx
	ON products(status, total_paid_sen DESC, settlement_sequence ASC);
CREATE INDEX contributions_activity_idx
	ON contributions(status, settled_at DESC);
CREATE INDEX contributions_contributor_product_idx
	ON contributions(contributor_id, product_id, status);
CREATE INDEX contributions_product_idx ON contributions(product_id);
CREATE INDEX webhook_events_processed_idx ON webhook_events(processed_at DESC);

CREATE TABLE platform_stats (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	total_raised_sen INTEGER NOT NULL DEFAULT 0 CHECK (total_raised_sen >= 0)
);

INSERT INTO platform_stats (id, total_raised_sen)
SELECT 1, COALESCE(SUM(amount_sen), 0)
FROM contributions
WHERE status = 'succeeded';

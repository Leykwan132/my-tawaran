ALTER TABLE platform_stats ADD COLUMN listing_count INTEGER NOT NULL DEFAULT 0 CHECK (listing_count >= 0);

UPDATE platform_stats
SET listing_count = (SELECT COUNT(*) FROM products WHERE status = 'active')
WHERE id = 1;

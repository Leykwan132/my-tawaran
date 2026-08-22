PRAGMA foreign_keys = ON;

DELETE FROM product_clicks;
DELETE FROM contributions;
DELETE FROM products;
DELETE FROM webhook_events;
DELETE FROM contributors WHERE id != 'anonymous';

UPDATE platform_stats
SET total_raised_sen = 0, listing_count = 0
WHERE id = 1;

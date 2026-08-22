CREATE TABLE product_clicks (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	clicked_at TEXT NOT NULL
);

CREATE INDEX product_clicks_recent_idx
	ON product_clicks(clicked_at DESC);
CREATE INDEX product_clicks_product_recent_idx
	ON product_clicks(product_id, clicked_at DESC);

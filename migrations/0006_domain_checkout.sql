INSERT INTO contributors (id, email_hash, email_domain)
VALUES ('anonymous', 'anonymous', 'system')
ON CONFLICT(id) DO NOTHING;

DROP INDEX IF EXISTS contributions_one_pending_checkout_idx;

CREATE UNIQUE INDEX contributions_one_pending_checkout_idx
	ON contributions(product_id)
	WHERE status = 'pending';

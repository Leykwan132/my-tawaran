CREATE UNIQUE INDEX contributions_one_pending_checkout_idx
	ON contributions(contributor_id, product_id) WHERE status = 'pending';

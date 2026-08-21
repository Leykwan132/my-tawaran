ALTER TABLE contributions ADD COLUMN cancel_token TEXT;
CREATE UNIQUE INDEX contributions_cancel_token_idx
	ON contributions(cancel_token) WHERE cancel_token IS NOT NULL;

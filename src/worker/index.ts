import { Hono } from "hono";
import { fetchCloudflareAnalytics, parseAnalyticsRange } from "./cloudflare-analytics";
import {
	buildCheckoutCopy,
	calculateContributionDue,
	MINIMUM_SEN,
} from "./ranking";
import { isTerminalCheckoutFailure, verifyStripeSignature } from "./stripe";

type Bindings = {
	my_tawaran_db: D1Database;
	STRIPE_SECRET_KEY?: string;
	STRIPE_WEBHOOK_SECRET?: string;
	APP_ORIGIN?: string;
	CF_ZONE_ID?: string;
	CF_ANALYTICS_API_TOKEN?: string;
};

type ProductRow = {
	id: string;
	canonical_url: string;
	domain: string;
	favicon_url: string;
	description?: string;
	click_count?: number;
	total_paid_sen: number;
	settlement_sequence: number | null;
	status: "draft" | "active";
};

type ContributionRow = {
	id: string;
	product_id: string;
	contributor_id: string;
	amount_sen: number;
	currency: string;
	stripe_session_id: string | null;
	cancel_token?: string | null;
	status: "pending" | "succeeded" | "expired";
};

type StripeSession = {
	id: string;
	payment_status?: "paid" | "unpaid" | "no_payment_required";
	amount_total?: number;
	currency?: string;
	payment_intent?: string | null;
	customer_email?: string | null;
	customer_details?: { email?: string | null };
	metadata?: Record<string, string>;
	url?: string;
};

type StripeEvent = {
	id: string;
	type: string;
	data: { object: StripeSession };
};

const app = new Hono<{ Bindings: Bindings }>();
const ANONYMOUS_CONTRIBUTOR_ID = "anonymous";

class ApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
	}
}

function jsonError(message: string, status = 400) {
	return { message, status };
}

function toIsoNow() {
	return new Date().toISOString();
}

function canonicalizeWebsite(value: unknown) {
	if (typeof value !== "string") throw new ApiError("Website URL is required", 400);
	let url: URL;
	try {
		url = new URL(value.trim());
	} catch {
		throw new ApiError("A valid website URL is required", 400);
	}
	if (url.protocol !== "https:") throw new ApiError("Website URL must use HTTPS", 400);
	if (
		url.hostname === "localhost" ||
		url.hostname.endsWith(".local") ||
		/^127\.|^10\.|^192\.168\.|^169\.254\./.test(url.hostname)
	) {
		throw new ApiError("Website URL must be publicly accessible", 400);
	}
	url.hash = "";
	url.search = "";
	url.username = "";
	url.password = "";
	return { canonicalUrl: url.toString(), domain: url.hostname.toLowerCase() };
}

function faviconFor(domain: string) {
	return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

function decodeHtmlEntities(value: string) {
	return value
		.replaceAll("&amp;", "&")
		.replaceAll("&quot;", '"')
		.replaceAll("&#39;", "'")
		.replaceAll("&lt;", "<")
		.replaceAll("&gt;", ">");
}

async function fetchWebsiteDescription(url: string) {
	try {
		const response = await fetch(url, {
			headers: { "User-Agent": "MyTawaranBot/1.0 (+https://mytawaran.com)" },
			redirect: "follow",
		});
		if (!response.ok) return "";
		const html = await response.text();
		const patterns = [
			/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
			/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
			/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
			/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
		];
		for (const pattern of patterns) {
			const match = pattern.exec(html);
			if (match?.[1]) return decodeHtmlEntities(match[1].trim()).slice(0, 280);
		}
		return "";
	} catch {
		return "";
	}
}

function originFor(request: Request, configuredOrigin?: string) {
	return (configuredOrigin || new URL(request.url).origin).replace(/\/$/, "");
}

async function stripeRequest<T>(
	secret: string | undefined,
	path: string,
	form: URLSearchParams,
	idempotencyKey: string,
): Promise<T> {
	if (!secret) throw new ApiError("Checkout is unavailable: missing STRIPE_SECRET_KEY", 503);
	const response = await fetch(`https://api.stripe.com/v1${path}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${secret}`,
			"Content-Type": "application/x-www-form-urlencoded",
			"Idempotency-Key": idempotencyKey,
		},
		body: form,
	});
	if (!response.ok) {
		const payload = (await response.json().catch(() => null)) as {
			error?: { message?: string };
		} | null;
		throw new ApiError(payload?.error?.message || "Unable to create Stripe Checkout", 502);
	}
	return (await response.json()) as T;
}

async function getOrCreateProduct(
	db: D1Database,
	website: { canonicalUrl: string; domain: string },
): Promise<ProductRow> {
	const existing = await db
		.prepare("SELECT * FROM products WHERE canonical_url = ?")
		.bind(website.canonicalUrl)
		.first<ProductRow>();
	if (existing) return existing;

	const id = crypto.randomUUID();
	const description = await fetchWebsiteDescription(website.canonicalUrl);
	try {
		await db
			.prepare(
				"INSERT INTO products (id, canonical_url, domain, favicon_url, description) VALUES (?, ?, ?, ?, ?)",
			)
			.bind(id, website.canonicalUrl, website.domain, faviconFor(website.domain), description)
			.run();
	} catch {
		const concurrentProduct = await db
			.prepare("SELECT * FROM products WHERE canonical_url = ?")
			.bind(website.canonicalUrl)
			.first<ProductRow>();
		if (concurrentProduct) return concurrentProduct;
		throw new ApiError("Unable to create website listing", 500);
	}
	return (await db
		.prepare("SELECT * FROM products WHERE id = ?")
		.bind(id)
		.first<ProductRow>())!;
}

async function removeExpiredDraftProduct(db: D1Database, productId: string) {
	await db
		.prepare(
			"DELETE FROM products WHERE id = ? AND status = 'draft' AND NOT EXISTS (SELECT 1 FROM contributions WHERE product_id = ? AND status != 'expired')",
		)
		.bind(productId, productId)
		.run();
}

app.get("/api/", (c) => c.json({ name: "MyTawaran" }));

app.get("/api/stats", async (c) => {
	const raisedRow = await c.env.my_tawaran_db
		.prepare("SELECT total_raised_sen AS total, listing_count AS listings FROM platform_stats WHERE id = 1")
		.first<{ total: number; listings: number }>();
	return c.json({
		totalRaisedSen: raisedRow?.total ?? 0,
		listingCount: raisedRow?.listings ?? 0,
	});
});

app.get("/api/cloudflare-analytics", async (c) => {
	const token = c.env.CF_ANALYTICS_API_TOKEN;
	const zoneTag = c.env.CF_ZONE_ID;
	if (!token || !zoneTag) {
		return c.json(jsonError("Cloudflare analytics is not configured", 503), 503);
	}

	const range = parseAnalyticsRange(c.req.query("range"));
	const cache = caches.default;
	const cacheKey = new Request(new URL(`/api/cloudflare-analytics?range=${range}`, c.req.url).toString(), {
		method: "GET",
	});
	const cached = await cache.match(cacheKey);
	if (cached) return cached;

	try {
		const analytics = await fetchCloudflareAnalytics(token, zoneTag, range);
		const response = c.json(analytics, 200, {
			"Cache-Control": "public, max-age=300",
		});
		c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
		return response;
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load Cloudflare analytics";
		return c.json(jsonError(message, 502), 502);
	}
});

app.get("/api/products", async (c) => {
	const limit = Math.min(Math.max(Number(c.req.query("limit") ?? 50), 1), 100);
	const offset = Math.max(Number(c.req.query("offset") ?? 0), 0);
	const totalRow = await c.env.my_tawaran_db
		.prepare("SELECT COUNT(*) AS total FROM products WHERE status = 'active'")
		.first<{ total: number }>();
	const total = totalRow?.total ?? 0;
	const raisedRow = await c.env.my_tawaran_db
		.prepare("SELECT total_raised_sen AS total, listing_count AS listings FROM platform_stats WHERE id = 1")
		.first<{ total: number; listings: number }>();
	const totalRaisedSen = raisedRow?.total ?? 0;
	const listingCount = raisedRow?.listings ?? total;
	const result = await c.env.my_tawaran_db
		.prepare(
			"SELECT id, canonical_url, domain, favicon_url, description, click_count, total_paid_sen, settlement_sequence FROM products WHERE status = 'active' ORDER BY total_paid_sen DESC, settlement_sequence ASC LIMIT ? OFFSET ?",
		)
		.bind(limit, offset)
		.all<ProductRow>();
	const products = (result.results ?? []).map((product, index) => ({
		id: product.id,
		domain: product.domain,
		url: product.canonical_url,
		faviconUrl: product.favicon_url,
		description: product.description ?? "",
		clickCount: product.click_count ?? 0,
		totalPaidSen: product.total_paid_sen,
		rank: offset + index + 1,
	}));
	return c.json({ products, total, totalRaisedSen, listingCount, limit, offset });
});

app.post("/api/products/:id/click", async (c) => {
	const productId = c.req.param("id");
	const now = toIsoNow();
	await c.env.my_tawaran_db.batch([
		c.env.my_tawaran_db
			.prepare("UPDATE products SET click_count = click_count + 1 WHERE id = ? AND status = 'active'")
			.bind(productId),
		c.env.my_tawaran_db
			.prepare(
				"INSERT INTO product_clicks (product_id, clicked_at) SELECT id, ? FROM products WHERE id = ? AND status = 'active'",
			)
			.bind(now, productId),
	]);
	return c.json({ ok: true });
});

app.get("/api/activity", async (c) => {
	const ranked = await c.env.my_tawaran_db
		.prepare(
			"SELECT id FROM products WHERE status = 'active' ORDER BY total_paid_sen DESC, settlement_sequence ASC",
		)
		.all<{ id: string }>();
	const ranks = new Map((ranked.results ?? []).map((row, index) => [row.id, index + 1]));

	const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
	const trendingRows = await c.env.my_tawaran_db
		.prepare(
			"SELECT p.domain, p.canonical_url, p.favicon_url, COUNT(*) AS clicks_per_hour FROM product_clicks c JOIN products p ON p.id = c.product_id WHERE p.status = 'active' AND c.clicked_at >= ? GROUP BY p.id, p.domain, p.canonical_url, p.favicon_url ORDER BY clicks_per_hour DESC, p.domain ASC LIMIT 6",
		)
		.bind(since)
		.all<{
			domain: string;
			canonical_url: string;
			favicon_url: string;
			clicks_per_hour: number;
		}>();
	const trending = (trendingRows.results ?? []).map((row) => ({
		domain: row.domain,
		url: row.canonical_url,
		faviconUrl: row.favicon_url,
		clicksPerHour: row.clicks_per_hour,
	}));

	const latestRows = await c.env.my_tawaran_db
		.prepare(
			"SELECT p.id AS product_id, p.domain, p.canonical_url, p.favicon_url, c.amount_sen, c.settled_at FROM contributions c JOIN products p ON p.id = c.product_id WHERE c.status = 'succeeded' AND p.status = 'active' ORDER BY c.settled_at DESC LIMIT 6",
		)
		.all<{
			product_id: string;
			domain: string;
			canonical_url: string;
			favicon_url: string;
			amount_sen: number;
			settled_at: string;
		}>();
	const latest = (latestRows.results ?? []).map((row) => ({
		domain: row.domain,
		url: row.canonical_url,
		faviconUrl: row.favicon_url,
		amountSen: row.amount_sen,
		rank: ranks.get(row.product_id) ?? null,
		settledAt: row.settled_at,
	}));

	return c.json({ trending, latest });
});

app.post("/api/checkout", async (c) => {
	try {
		const body = await c.req.json<{
			url?: string;
			targetContributionSen?: number;
		}>();
		const website = canonicalizeWebsite(body.url);
		const targetContributionSen = body.targetContributionSen;
		if (!Number.isSafeInteger(targetContributionSen)) {
			throw new ApiError("A whole-sen target amount is required", 400);
		}
		const safeTargetContributionSen = targetContributionSen as number;

		const db = c.env.my_tawaran_db;
		await db
			.prepare(
				"INSERT OR IGNORE INTO contributors (id, email_hash, email_domain) VALUES (?, ?, ?)",
			)
			.bind(ANONYMOUS_CONTRIBUTOR_ID, "anonymous", "system")
			.run();
		const product = await getOrCreateProduct(db, website);
		const contributionId = crypto.randomUUID();
		let amountDueSen: number;
		try {
			amountDueSen = calculateContributionDue(
				product.total_paid_sen,
				safeTargetContributionSen,
			);
		} catch (error) {
			throw new ApiError(
				error instanceof Error ? error.message : "Invalid target contribution",
				400,
			);
		}
		if (amountDueSen < MINIMUM_SEN) throw new ApiError("Checkout minimum is RM2.00", 400);

		const projectedTotal = product.total_paid_sen + amountDueSen;
		const higherCount = await db
			.prepare(
				"SELECT COUNT(*) AS count FROM products WHERE status = 'active' AND total_paid_sen > ?",
			)
			.bind(projectedTotal)
			.first<{ count: number }>();
		const projectedRank = (higherCount?.count ?? 0) + 1;
		const cancelToken = crypto.randomUUID();
		try {
			await db
				.prepare(
					"INSERT INTO contributions (id, product_id, contributor_id, amount_sen, cancel_token) VALUES (?, ?, ?, ?, ?)",
				)
				.bind(contributionId, product.id, ANONYMOUS_CONTRIBUTOR_ID, amountDueSen, cancelToken)
				.run();
		} catch {
			const existingPending = await db
				.prepare(
					"SELECT id FROM contributions WHERE product_id = ? AND status = 'pending'",
				)
				.bind(product.id)
				.first<{ id: string }>();
			if (existingPending) {
				throw new ApiError("A checkout for this website is already pending", 409);
			}
			throw new Error("Unable to create checkout record");
		}

		const copy = buildCheckoutCopy({
			projectedRank,
			domain: product.domain,
			amountDueSen,
		});
		const origin = originFor(c.req.raw, c.env.APP_ORIGIN);
		const form = new URLSearchParams({
			mode: "payment",
			"line_items[0][price_data][currency]": "myr",
			"line_items[0][price_data][unit_amount]": String(amountDueSen),
			"line_items[0][price_data][product_data][name]": copy.name,
			"line_items[0][price_data][product_data][description]": copy.description,
			"line_items[0][quantity]": "1",
			success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${origin}/?checkout=cancelled&cancel_token=${cancelToken}`,
			"metadata[contribution_id]": contributionId,
			"metadata[product_id]": product.id,
			integration_identifier: `mytawaran_${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}`,
		});

		try {
			const session = await stripeRequest<StripeSession>(
				c.env.STRIPE_SECRET_KEY,
				"/checkout/sessions",
				form,
				contributionId,
			);
			await db
				.prepare("UPDATE contributions SET stripe_session_id = ? WHERE id = ?")
				.bind(session.id, contributionId)
				.run();
			return c.json({
				checkoutUrl: session.url,
				projectedRank,
				amountDueSen,
			});
		} catch (error) {
			await db.prepare("DELETE FROM contributions WHERE id = ?").bind(contributionId).run();
			await db
				.prepare(
					"DELETE FROM products WHERE id = ? AND status = 'draft' AND NOT EXISTS (SELECT 1 FROM contributions WHERE product_id = ?)",
				)
				.bind(product.id, product.id)
				.run();
			throw error;
		}
	} catch (error) {
		if (error instanceof ApiError) {
			return c.json(
				jsonError(error.message),
				error.status as 400 | 409 | 500 | 502 | 503,
			);
		}
		const message = error instanceof Error ? error.message : "Unable to start checkout";
		return c.json(jsonError(message, 500), 500);
	}
});

app.get("/api/checkout/:id", async (c) => {
	const contribution = await c.env.my_tawaran_db
		.prepare("SELECT status FROM contributions WHERE stripe_session_id = ?")
		.bind(c.req.param("id"))
		.first<{ status: ContributionRow["status"] }>();
	if (!contribution) return c.json(jsonError("Checkout was not found", 404), 404);
	return c.json({ status: contribution.status });
});

app.post("/api/checkout/cancel/:token", async (c) => {
	const db = c.env.my_tawaran_db;
	const contribution = await db
		.prepare(
			"SELECT id, product_id, stripe_session_id, status FROM contributions WHERE cancel_token = ?",
		)
		.bind(c.req.param("token"))
		.first<ContributionRow>();
	if (!contribution) return c.json(jsonError("Checkout was not found", 404), 404);
	if (contribution.status !== "pending") return c.json({ status: contribution.status });

	try {
		if (contribution.stripe_session_id) {
			await stripeRequest<StripeSession>(
				c.env.STRIPE_SECRET_KEY,
				`/checkout/sessions/${contribution.stripe_session_id}/expire`,
				new URLSearchParams(),
				`${contribution.id}:expire`,
			);
		}
		await db
			.prepare("UPDATE contributions SET status = 'expired' WHERE id = ? AND status = 'pending'")
			.bind(contribution.id)
			.run();
		await removeExpiredDraftProduct(db, contribution.product_id);
		return c.json({ status: "expired" });
	} catch {
		return c.json(jsonError("Unable to cancel checkout", 502), 502);
	}
});

app.post("/api/stripe/webhook", async (c) => {
	const rawBody = await c.req.text();
	const valid = await verifyStripeSignature(
		rawBody,
		c.req.header("Stripe-Signature") ?? null,
		c.env.STRIPE_WEBHOOK_SECRET ?? "",
	);
	if (!valid) return c.json(jsonError("Invalid Stripe signature"), 400);

	let event: StripeEvent;
	try {
		event = JSON.parse(rawBody) as StripeEvent;
	} catch {
		return c.json(jsonError("Invalid Stripe payload"), 400);
	}

	const session = event.data.object;
	const contributionId = session.metadata?.contribution_id;
	const productId = session.metadata?.product_id;
	if (!contributionId || !productId) return c.json({ received: true });

	const db = c.env.my_tawaran_db;
	await db
		.prepare("INSERT OR IGNORE INTO webhook_events (stripe_event_id, event_type) VALUES (?, ?)")
		.bind(event.id, event.type)
		.run();

	if (isTerminalCheckoutFailure(event.type)) {
		await db
			.prepare("UPDATE contributions SET status = 'expired' WHERE id = ? AND status = 'pending'")
			.bind(contributionId)
			.run();
		await removeExpiredDraftProduct(db, productId);
		return c.json({ received: true });
	}

	if (
		(event.type !== "checkout.session.completed" &&
			event.type !== "checkout.session.async_payment_succeeded") ||
		session.payment_status !== "paid"
	) {
		return c.json({ received: true });
	}

	const contribution = await db
		.prepare("SELECT * FROM contributions WHERE id = ? AND product_id = ?")
		.bind(contributionId, productId)
		.first<ContributionRow>();
	if (
		!contribution ||
		(contribution.stripe_session_id && contribution.stripe_session_id !== session.id) ||
		session.amount_total !== contribution.amount_sen ||
		session.currency !== contribution.currency
	) {
		return c.json(jsonError("Stripe checkout did not match its contribution"), 400);
	}

	const webhook = await db
		.prepare("SELECT sequence FROM webhook_events WHERE stripe_event_id = ?")
		.bind(event.id)
		.first<{ sequence: number }>();
	if (!webhook) return c.json(jsonError("Unable to record Stripe event", 500), 500);
	const now = toIsoNow();
	await db.batch([
		db
			.prepare(
				"UPDATE contributions SET stripe_session_id = ?, stripe_payment_intent_id = ?, status = 'succeeded', settlement_sequence = ?, settled_at = ? WHERE id = ? AND status = 'pending'",
			)
			.bind(session.id, session.payment_intent ?? null, webhook.sequence, now, contributionId),
		db
			.prepare(
				"UPDATE platform_stats SET listing_count = listing_count + 1 WHERE id = 1 AND EXISTS (SELECT 1 FROM products WHERE id = ? AND status = 'draft') AND EXISTS (SELECT 1 FROM contributions WHERE id = ? AND status = 'succeeded' AND settlement_sequence = ? AND applied_at IS NULL)",
			)
			.bind(productId, contributionId, webhook.sequence),
		db
			.prepare(
				"UPDATE products SET total_paid_sen = total_paid_sen + (SELECT amount_sen FROM contributions WHERE id = ?), settlement_sequence = ?, status = 'active', updated_at = ? WHERE id = ? AND EXISTS (SELECT 1 FROM contributions WHERE id = ? AND status = 'succeeded' AND settlement_sequence = ? AND applied_at IS NULL)",
			)
			.bind(contributionId, webhook.sequence, now, productId, contributionId, webhook.sequence),
		db
			.prepare(
				"UPDATE platform_stats SET total_raised_sen = total_raised_sen + COALESCE((SELECT amount_sen FROM contributions WHERE id = ? AND status = 'succeeded' AND settlement_sequence = ? AND applied_at IS NULL), 0) WHERE id = 1",
			)
			.bind(contributionId, webhook.sequence),
		db
			.prepare(
				"UPDATE contributions SET applied_at = ? WHERE id = ? AND status = 'succeeded' AND settlement_sequence = ? AND applied_at IS NULL",
			)
			.bind(now, contributionId, webhook.sequence),
	]);

	return c.json({ received: true });
});

export default app;

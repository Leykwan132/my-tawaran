import { FormEvent, Fragment, useEffect, useMemo, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Globe } from "lucide-react";
import posthog from "posthog-js";
import { AboutMytawaranDialog } from "@/components/about-mytawaran-dialog";
import { LanguageSwitch } from "@/components/language-switch";
import { LeaderboardPagination } from "@/components/leaderboard-pagination";
import { Separator } from "@/components/ui/separator";
import { useLocale } from "@/i18n/locale-provider";
import {
	projectRank,
	calculateListingTopUpSen,
	minimumTotalForRank,
	MINIMUM_SEN,
} from "../worker/ranking";
import { DEMO_PRODUCTS, DEMO_TRENDING, DEMO_LATEST, type LatestPayment, type Product, type TrendingSite } from "@/demo-products";
import logo from "./assets/mytawaran-hibiscus.png";
import malaysiaFlag from "./assets/malaysia-flag.png";
import "./App.css";

const BID_STEP_SEN = 100;
const PAGE_SIZE = 50;

function normalizeBidSen(value: number) {
	if (!Number.isFinite(value)) return MINIMUM_SEN;
	return Math.max(MINIMUM_SEN, Math.round(value * 100));
}

function formatBidInput(sen: number) {
	return String(sen / 100);
}

function normalizeRankInput(value: number, maxRank: number) {
	if (!Number.isFinite(value)) return 1;
	return Math.max(1, Math.min(maxRank, Math.floor(value)));
}

function parseDomainFromUrl(value: string) {
	const trimmed = value.trim();
	if (!trimmed) return null;
	try {
		const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
		if (!parsed.hostname || parsed.hostname.includes(" ")) return null;
		if (!parsed.hostname.includes(".")) return null;
		return parsed.hostname.toLowerCase();
	} catch {
		return null;
	}
}

function faviconFor(domain: string) {
	return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

function normalizeUrlInput(value: string) {
	const trimmed = value.trim();
	if (!trimmed) return trimmed;
	return trimmed.includes("://") ? trimmed : `https://${trimmed}`;
}

function AutoSizeInput({
	className,
	value,
	...props
}: InputHTMLAttributes<HTMLInputElement> & { value: string }) {
	return (
		<span className="bid-input-autosize">
			<span className="bid-input-sizer" aria-hidden="true">
				{value || "0"}
			</span>
			<input className={className} value={value} {...props} size={1} />
		</span>
	);
}

function Header() {
	const { t } = useLocale();

	return (
		<header className="site-header">
			<a className="brand" href="/">
				<img src={logo} alt="" />
				<span>mytawaran</span>
			</a>
			<nav className="site-nav" aria-label={t("navMain")}>
				<LanguageSwitch />
				<a href="/">{t("navLeaderboard")}</a>
				<a href="/stats">{t("navStats")}</a>
				<AboutMytawaranDialog variant="nav" />
			</nav>
		</header>
	);
}

function Footer() {
	const { t } = useLocale();

	return (
		<footer className="site-footer">
			<p>
				{t("footerBuiltProudly")}
				<img className="site-footer-flag" src={malaysiaFlag} alt="Malaysia" />
				{t("footerAndBy")}{" "}
				<a href="https://www.linkedin.com/in/ley-kwan-c-129678228/" target="_blank" rel="noreferrer">
					Kwan
				</a>
			</p>
		</footer>
	);
}

function StatsPage() {
	const { t } = useLocale();
	const embedUrl = import.meta.env.VITE_PUBLIC_POSTHOG_DASHBOARD_EMBED_URL as string | undefined;
	return (
		<main className="site-shell stats-shell">
			<Header />
			<section className="stats-header">
				<p className="eyebrow">{t("statsEyebrow")}</p>
				<h1>{t("statsTitle")}</h1>
				<p>{t("statsDescription")}</p>
			</section>
			{embedUrl ? (
				<iframe className="posthog-embed" src={embedUrl} title={t("statsIframeTitle")} />
			) : (
				<section className="stats-empty">
					<h2>{t("statsEmptyTitle")}</h2>
					<p>
						{t("statsEmptyBody")}
					</p>
				</section>
			)}
			<Footer />
		</main>
	);
}

function trackOutbound(product: Product) {
	posthog.capture("outbound_link_clicked", {
		destination_url: product.url,
		destination_domain: product.domain,
		source_page: "leaderboard",
	});
	if (!product.id.startsWith("demo-")) {
		void fetch(`/api/products/${encodeURIComponent(product.id)}/click`, { method: "POST" });
	}
}

function formatClicks(clickCount: number, number: Intl.NumberFormat, t: ReturnType<typeof useLocale>["t"]) {
	return t(clickCount === 1 ? "clicksOne" : "clicksMany", { count: number.format(clickCount) });
}

function ProductCopy({ product }: { product: Product }) {
	return (
		<div className="product-copy">
			<span className="product-domain">{product.domain}</span>
			{product.description ? <p className="product-description">{product.description}</p> : null}
		</div>
	);
}

function LeaderboardRowCopy({ product }: { product: Product }) {
	return (
		<div className="leaderboard-row-copy">
			<div className="leaderboard-row-title">
				<span className="leaderboard-row-rank">#{product.rank}</span>
				<span className="product-domain">{product.domain}</span>
			</div>
			{product.description ? <p className="product-description">{product.description}</p> : null}
		</div>
	);
}

function ProductLink({
	product,
	className,
	children,
}: {
	product: Product;
	className: string;
	children: ReactNode;
}) {
	return (
		<a
			className={className}
			href={product.url}
			target="_blank"
			rel="noreferrer"
			onClick={() => trackOutbound(product)}
		>
			{children}
		</a>
	);
}

function PodiumPlaceholder({ rank }: { rank: 1 | 2 | 3 }) {
	const { t } = useLocale();
	return (
		<div className={`podium-card podium-card--rank-${rank} podium-card--empty`} aria-label={t("rankAvailable", { rank })}>
			<div className="podium-card-header podium-card-header--empty">
				<span className={`podium-rank podium-rank--${rank}`}>#{rank}</span>
			</div>
			<div className="podium-placeholder-mark" aria-hidden="true">
				?
			</div>
		</div>
	);
}

function PodiumCard({ product, rank }: { product: Product; rank: 1 | 2 | 3 }) {
	const { t, currency, number } = useLocale();
	return (
		<ProductLink product={product} className={`podium-card podium-card--rank-${rank}`}>
			<div className="podium-card-header">
				<span className={`podium-rank podium-rank--${rank}`}>#{rank}</span>
				<div className="podium-card-stats">
					<strong className="product-price">{currency.format(product.totalPaidSen / 100)}</strong>
					<span className="podium-card-clicks">{formatClicks(product.clickCount, number, t)}</span>
				</div>
			</div>
			<img src={product.faviconUrl} alt="" />
			<ProductCopy product={product} />
		</ProductLink>
	);
}

function LeaderboardRow({ product }: { product: Product }) {
	const { t, currency, number } = useLocale();
	return (
		<ProductLink product={product} className="leaderboard-row">
			<img src={product.faviconUrl} alt="" />
			<LeaderboardRowCopy product={product} />
			<div className="leaderboard-row-stats">
				<strong className="product-price">{currency.format(product.totalPaidSen / 100)}</strong>
				<span className="leaderboard-row-clicks">{formatClicks(product.clickCount, number, t)}</span>
			</div>
		</ProductLink>
	);
}

function Leaderboard({
	products,
	total,
	page,
	onPageChange,
	trending,
	latest,
}: {
	products: Product[];
	total: number;
	page: number;
	onPageChange: (page: number) => void;
	trending: TrendingSite[];
	latest: LatestPayment[];
}) {
	const showPodium = page === 0;
	const rest = showPodium ? products.filter((product) => product.rank > 3) : products;
	const { t, currency, number } = useLocale();

	if (products.length === 0 && total === 0) return null;

	const podiumOrder = [2, 1, 3] as const;

	return (
		<div className="leaderboard">
			{showPodium && (
				<div className="leaderboard-podium-wrap">
					<div className="podium">
						{podiumOrder.map((rank) => {
							const product = products.find((entry) => entry.rank === rank);
							if (!product) return <PodiumPlaceholder key={rank} rank={rank} />;
							return <PodiumCard key={product.id} product={product} rank={rank} />;
						})}
					</div>
				</div>
			)}

			<div className={`leaderboard-body${showPodium ? " leaderboard-body--rails" : ""}`}>
				{showPodium ? (
					<section className="activity-panel activity-panel--trending" aria-labelledby="trending-heading">
						<h2 id="trending-heading">{t("trendingTitle")}</h2>
						{trending.length === 0 ? (
							<p className="activity-empty">{t("trendingEmpty")}</p>
						) : (
							<ul>
								{trending.map((site) => (
									<li key={site.domain}>
										<a
											href={site.url}
											target="_blank"
											rel="noreferrer"
											onClick={() =>
												posthog.capture("outbound_link_clicked", {
													destination_url: site.url,
													destination_domain: site.domain,
													source_page: "trending",
												})
											}
										>
											<img src={site.faviconUrl} alt="" />
											<span className="activity-domain">{site.domain}</span>
											<span className="activity-meta">
											{t(site.clicksPerHour === 1 ? "clicksPerHourOne" : "clicksPerHour", {
												count: number.format(site.clicksPerHour),
											})}
											</span>
										</a>
									</li>
								))}
							</ul>
						)}
					</section>
				) : null}

				{rest.length > 0 ? (
					<div className="leaderboard-rows">
						{rest.map((product, index) => (
							<Fragment key={product.id}>
								{index > 0 ? <Separator /> : null}
								<LeaderboardRow product={product} />
							</Fragment>
						))}
					</div>
				) : (
					<div />
				)}

				{showPodium ? (
					<section className="activity-panel activity-panel--latest" aria-labelledby="latest-heading">
						<h2 id="latest-heading">{t("latestActivityTitle")}</h2>
						{latest.length === 0 ? (
							<p className="activity-empty">{t("latestEmpty")}</p>
						) : (
							<ul>
								{latest.map((payment, index) => (
									<li key={`${payment.domain}-${index}`}>
										<a
											href={payment.url}
											target="_blank"
											rel="noreferrer"
											onClick={() =>
												posthog.capture("outbound_link_clicked", {
													destination_url: payment.url,
													destination_domain: payment.domain,
													source_page: "latest_activity",
												})
											}
										>
											<span className="activity-rank">#{payment.rank ?? "—"}</span>
											<img src={payment.faviconUrl} alt="" />
											<span className="activity-domain">{payment.domain}</span>
											<span className="activity-price">{currency.format(payment.amountSen / 100)}</span>
										</a>
									</li>
								))}
							</ul>
						)}
					</section>
				) : null}
			</div>

			<LeaderboardPagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={onPageChange} />
		</div>
	);
}

function App() {
	const { t, number } = useLocale();
	const isStatsPage = window.location.pathname === "/stats";
	const [products, setProducts] = useState<Product[]>([]);
	const [productTotal, setProductTotal] = useState(0);
	const [rankingProducts, setRankingProducts] = useState<Product[]>([]);
	const [trending, setTrending] = useState<TrendingSite[]>([]);
	const [latest, setLatest] = useState<LatestPayment[]>([]);
	const [page, setPage] = useState(0);
	const [url, setUrl] = useState("");
	const [bidSen, setBidSen] = useState(MINIMUM_SEN);
	const [bidInput, setBidInput] = useState(formatBidInput(MINIMUM_SEN));
	const [rankInput, setRankInput] = useState("1");
	const updatingFromRank = useRef(false);
	const [errorKey, setErrorKey] = useState<"loadLeaderboardError" | "checkoutCancelled" | "checkoutCancelProcessing" | "checkoutStartError" | null>(null);
	const [errorRaw, setErrorRaw] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	function showTranslatedError(key: "loadLeaderboardError" | "checkoutCancelled" | "checkoutCancelProcessing" | "checkoutStartError") {
		setErrorRaw("");
		setErrorKey(key);
	}

	function showRawError(message: string) {
		setErrorKey(null);
		setErrorRaw(message);
	}

	useEffect(() => {
		posthog.capture("page_viewed", { page: isStatsPage ? "stats" : "leaderboard" });
		if (isStatsPage) return;
		const liveLeaderboard =
			import.meta.env.DEV && new URLSearchParams(window.location.search).get("live") === "1";
		if (import.meta.env.DEV && !liveLeaderboard) return;

		const offset = page * PAGE_SIZE;
		void fetch(`/api/products?limit=${PAGE_SIZE}&offset=${offset}`)
			.then((response) => response.json() as Promise<{ products: Product[]; total: number }>)
			.then((productData) => {
				setProducts(productData.products);
				setProductTotal(productData.total);
			})
			.catch(() => showTranslatedError("loadLeaderboardError"));
	}, [isStatsPage, page]);

	useEffect(() => {
		if (isStatsPage) return;
		const liveLeaderboard =
			import.meta.env.DEV && new URLSearchParams(window.location.search).get("live") === "1";
		if (import.meta.env.DEV && !liveLeaderboard) return;

		void fetch("/api/products?limit=100&offset=0")
			.then((response) => response.json() as Promise<{ products: Product[] }>)
			.then((productData) => {
				setRankingProducts(productData.products);
			})
			.catch(() => setRankingProducts([]));

		void fetch("/api/activity")
			.then((response) => response.json() as Promise<{ trending: TrendingSite[]; latest: LatestPayment[] }>)
			.then((activity) => {
				setTrending(activity.trending ?? []);
				setLatest(activity.latest ?? []);
			})
			.catch(() => {
				setTrending([]);
				setLatest([]);
			});
	}, [isStatsPage]);

	useEffect(() => {
		const search = new URLSearchParams(window.location.search);
		const cancelToken = search.get("cancel_token");
		if (search.get("checkout") !== "cancelled" || !cancelToken) return;
		void fetch(`/api/checkout/cancel/${encodeURIComponent(cancelToken)}`, { method: "POST" })
			.then((response) => {
				if (!response.ok) throw new Error("Cancellation is still processing.");
				showTranslatedError("checkoutCancelled");
				window.history.replaceState({}, "", window.location.pathname);
			})
			.catch(() => showTranslatedError("checkoutCancelProcessing"));
	}, []);

	function commitBidInput(rawValue = bidInput) {
		const nextSen = normalizeBidSen(Number(rawValue));
		setBidSen(nextSen);
		setBidInput(formatBidInput(nextSen));
		return nextSen;
	}

	function adjustBid(delta: number) {
		setBidSen((current) => {
			const next = Math.max(MINIMUM_SEN, current + delta);
			setBidInput(formatBidInput(next));
			return next;
		});
	}

	const previewDomain = useMemo(() => parseDomainFromUrl(url), [url]);
	const [faviconFailed, setFaviconFailed] = useState(false);

	useEffect(() => {
		setFaviconFailed(false);
	}, [previewDomain]);
	const useLiveLeaderboard = import.meta.env.DEV && new URLSearchParams(window.location.search).get("live") === "1";
	const showDemoLeaderboard = import.meta.env.DEV && !useLiveLeaderboard;
	const displayProducts = showDemoLeaderboard
		? DEMO_PRODUCTS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
		: products;
	const displayTotal = showDemoLeaderboard ? DEMO_PRODUCTS.length : productTotal;
	const displayPage = page;
	const displayTrending = showDemoLeaderboard ? DEMO_TRENDING : trending;
	const displayLatest = showDemoLeaderboard ? DEMO_LATEST : latest;
	const catalogProducts = showDemoLeaderboard ? DEMO_PRODUCTS : rankingProducts;
	const rankingTotalsForBid = catalogProducts.map((product) => product.totalPaidSen);
	const matchedListing = useMemo(() => {
		if (!previewDomain) return null;
		return catalogProducts.find((product) => product.domain === previewDomain) ?? null;
	}, [previewDomain, catalogProducts]);
	const effectiveBidSen = useMemo(() => {
		const parsed = Number(bidInput);
		if (bidInput.trim() === "" || !Number.isFinite(parsed)) return bidSen;
		return normalizeBidSen(parsed);
	}, [bidInput, bidSen]);
	const displayAmountSen = useMemo(
		() => calculateListingTopUpSen(effectiveBidSen, matchedListing?.totalPaidSen ?? null),
		[effectiveBidSen, matchedListing],
	);
	const projectedRank = useMemo(
		() => projectRank(effectiveBidSen, rankingTotalsForBid),
		[effectiveBidSen, rankingTotalsForBid],
	);
	const maxRank = Math.max(rankingTotalsForBid.length + 1, 1);

	function commitRankInput(rawValue = rankInput) {
		const nextRank = normalizeRankInput(Number(rawValue), maxRank);
		const nextSen = minimumTotalForRank(nextRank, rankingTotalsForBid, {
			excludeTotalSen: matchedListing?.totalPaidSen ?? null,
			minimumSen: MINIMUM_SEN,
		});
		updatingFromRank.current = true;
		setBidSen(nextSen);
		setBidInput(formatBidInput(nextSen));
		setRankInput(String(nextRank));
		return nextRank;
	}

	useEffect(() => {
		if (updatingFromRank.current) {
			updatingFromRank.current = false;
			return;
		}
		setRankInput(String(projectedRank));
	}, [projectedRank]);

	const handlePageChange = (nextPage: number) => {
		setPage(Math.max(0, nextPage));
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	async function startCheckout(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrorKey(null);
		setErrorRaw("");
		const checkoutBidSen = commitBidInput();
		const checkoutUrl = normalizeUrlInput(url);
		setIsSubmitting(true);
		try {
			const response = await fetch("/api/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ url: checkoutUrl, targetContributionSen: checkoutBidSen }),
			});
			const data = await response.json() as { checkoutUrl?: string; message?: string };
			if (!response.ok || !data.checkoutUrl) throw new Error(data.message || t("checkoutStartError"));
			posthog.capture("checkout_started", { source_page: "leaderboard" });
			window.location.assign(data.checkoutUrl);
		} catch (checkoutError) {
			showRawError(checkoutError instanceof Error ? checkoutError.message : t("checkoutStartError"));
			setIsSubmitting(false);
		}
	}

	if (isStatsPage) return <StatsPage />;

	return (
		<main className="site-shell">
			<Header />
			<section className="center-column" aria-labelledby="page-title">
				<div className="hero">
					<AboutMytawaranDialog />
					<h1 id="page-title" className="hero-headline">
						<span className="hero-headline-row hero-headline-row--claim">
							<span className="hero-title-text">{t("heroClaim")}</span>
							<span className="hero-rank-controls">
								<span className="bid-rank-prefix">#</span>
								<AutoSizeInput
									className="bid-rank-input"
									type="text"
									inputMode="numeric"
									autoComplete="off"
									spellCheck={false}
									value={rankInput}
									onChange={(event) => setRankInput(event.target.value.replace(/\D/g, ""))}
									onBlur={() => commitRankInput()}
									onKeyDown={(event) => {
										if (event.key === "Enter") {
											event.preventDefault();
											commitRankInput();
										}
									}}
									aria-label={t("targetRank")}
								/>
								<img className="hero-rank-flag" src={malaysiaFlag} alt="" />
							</span>
						</span>
						<span className="hero-headline-row hero-headline-row--for">
							<span className="hero-title-text">{t("heroFor")}</span>
						</span>
						<span className="hero-headline-row hero-headline-row--amount">
							<span className="hero-amount-controls">
								<button
									type="button"
									className="bid-step bid-step--hero"
									onClick={() => adjustBid(-BID_STEP_SEN)}
									disabled={bidSen <= MINIMUM_SEN}
									aria-label={t("decreaseBid")}
								>
									<span>−</span>
								</button>
								<label className="bid-amount-field">
									<span className="bid-currency">RM</span>
									<AutoSizeInput
										className="bid-amount-input"
										type="text"
										inputMode="decimal"
										autoComplete="off"
										spellCheck={false}
										value={bidInput}
										onChange={(event) => setBidInput(event.target.value.replace(/[^\d.]/g, ""))}
										onBlur={() => commitBidInput()}
										onKeyDown={(event) => {
											if (event.key === "Enter") {
												event.preventDefault();
												commitBidInput();
											}
										}}
										aria-label={t("bidAmount")}
									/>
								</label>
								<button type="button" className="bid-step bid-step--hero" onClick={() => adjustBid(BID_STEP_SEN)} aria-label={t("increaseBid")}>
									<span>+</span>
								</button>
							</span>
						</span>
					</h1>
				</div>

				<form className="claim-form" onSubmit={startCheckout}>
					<div className="claim-primary">
						<label className="url-field">
							<span className="sr-only">{t("websiteUrl")}</span>
							{previewDomain && !faviconFailed ? (
								<img
									className="url-field-icon url-field-icon--favicon"
									src={faviconFor(previewDomain)}
									alt=""
									onError={() => setFaviconFailed(true)}
								/>
							) : (
								<Globe className="url-field-icon" aria-hidden="true" />
							)}
							<input
								required
								type="text"
								inputMode="url"
								placeholder={t("productUrlPlaceholder")}
								value={url}
								onChange={(event) => setUrl(event.target.value)}
							/>
						</label>
						<button type="submit" disabled={isSubmitting}>
							{isSubmitting ? t("opening") : t("claim")}
						</button>
					</div>
					{displayTotal > 0 ? (
						<p className="listing-count">
							{t(displayTotal === 1 ? "listingsOne" : "listingsMany", {
								count: number.format(displayTotal),
							})}
						</p>
					) : null}
					{(errorRaw || errorKey) && <p className="form-error">{errorRaw || (errorKey ? t(errorKey) : "")}</p>}
				</form>

				<Leaderboard
					products={displayProducts}
					total={displayTotal}
					page={displayPage}
					onPageChange={handlePageChange}
					trending={displayTrending}
					latest={displayLatest}
				/>
			</section>
			<Footer />
		</main>
	);
}

export default App;

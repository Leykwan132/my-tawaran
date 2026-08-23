import { FormEvent, Fragment, useEffect, useMemo, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Clock, Globe, Menu, X } from "lucide-react";
import posthog from "posthog-js";
import { AboutMytawaranDialog } from "@/components/about-mytawaran-dialog";
import { StatsDashboard } from "@/components/stats-dashboard";
import { LanguageSwitch } from "@/components/language-switch";
import { Separator } from "@/components/ui/separator";
import { useLocale } from "@/i18n/locale-provider";
import {
	projectRank,
	claimPreviewForRank,
	MINIMUM_SEN,
} from "../worker/ranking";
import { DEMO_PRODUCTS, DEMO_TRENDING, DEMO_LATEST, DEMO_RAISED_SEN, type LatestPayment, type Product, type TrendingSite } from "@/demo-products";
import { appendLeaderboardPage } from "@/leaderboard-pages";
import SplitFlapText from "@/components/SplitFlapText";
import logo from "./assets/mytawaran-hibiscus.png";
import malaysiaFlag from "./assets/malaysia-flag.png";
import trendingFire from "./assets/trending-fire.png";
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
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		if (!menuOpen) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previous;
		};
	}, [menuOpen]);

	return (
		<>
			{menuOpen ? (
				<button
					type="button"
					className="site-nav-overlay"
					aria-label={t("navMenuClose")}
					onClick={() => setMenuOpen(false)}
				/>
			) : null}
			<header className={`site-header${menuOpen ? " is-open" : ""}`}>
				<a className="brand" href="/">
					<img src={logo} alt="" />
					<span>mytawaran</span>
				</a>
				<button
					type="button"
					className="site-nav-toggle"
					aria-expanded={menuOpen}
					aria-controls="site-nav"
					aria-label={menuOpen ? t("navMenuClose") : t("navMenuOpen")}
					onClick={() => setMenuOpen((open) => !open)}
				>
					{menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
				</button>
				<nav id="site-nav" className="site-nav" aria-label={t("navMain")}>
					<LanguageSwitch />
					<a href="/" onClick={() => setMenuOpen(false)}>
						{t("navLeaderboard")}
					</a>
					<a href="/stats" onClick={() => setMenuOpen(false)}>
						{t("navStats")}
					</a>
					<AboutMytawaranDialog variant="nav" />
				</nav>
			</header>
		</>
	);
}

function Footer() {
	return (
		<footer className="site-footer">
			<p>
				Brought to you by {" "}
				<a href="https://www.linkedin.com/in/ley-kwan-c-129678228/" target="_blank" rel="noreferrer">
					Kwan
				</a>{" "}
				and {" "}
				<a href="https://kilobot.app" target="_blank" rel="noreferrer">
					kilobot.app
				</a>
			</p>
		</footer>
	);
}

function StatsPage() {
	const { t } = useLocale();
	return (
		<main className="site-shell stats-shell">
			<Header />
			<section className="stats-header">
				<h1>{t("statsTitle")}</h1>
			</section>
			<StatsDashboard />
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
		void fetch(`/api/products/${encodeURIComponent(product.id)}/click`, { method: "POST", keepalive: true }).catch(() => {});
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

function RankChip({
	rank,
	onClaimRank,
	onPreviewRank,
}: {
	rank: number;
	onClaimRank: (rank: number) => void;
	onPreviewRank: (rank: number | null) => void;
}) {
	const { t } = useLocale();
	return (
		<button
			type="button"
			className="leaderboard-row-rank"
			aria-label={t("claim", { rank })}
			onMouseEnter={() => onPreviewRank(rank)}
			onMouseLeave={() => onPreviewRank(null)}
			onFocus={() => onPreviewRank(rank)}
			onBlur={() => onPreviewRank(null)}
			onClick={(event) => {
				event.preventDefault();
				event.stopPropagation();
				onClaimRank(rank);
			}}
		>
			<span className="leaderboard-row-rank-idle">#{rank}</span>
			<span className="leaderboard-row-rank-action">{t("claim", { rank })}</span>
		</button>
	);
}

function LeaderboardRowCopy({
	product,
	onClaimRank,
	onPreviewRank,
}: {
	product: Product;
	onClaimRank: (rank: number) => void;
	onPreviewRank: (rank: number | null) => void;
}) {
	return (
		<div className="leaderboard-row-copy">
			<div className="leaderboard-row-title">
				<span className="product-domain">{product.domain}</span>
				<RankChip rank={product.rank} onClaimRank={onClaimRank} onPreviewRank={onPreviewRank} />
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
		<div
			className={`podium-card podium-card--rank-${rank} podium-card--empty`}
			aria-label={`${t("rankAvailable", { rank })}. ${t("podiumUnclaimed")} ${t("podiumCouldBeYours")}`}
		>
			<div className="podium-card-header podium-card-header--empty">
				<span className={`podium-rank podium-rank--${rank}`}>#{rank}</span>
			</div>
			<div className="podium-placeholder-mark" aria-hidden="true">
				?
			</div>
			<div className="podium-placeholder-copy">
				<p className="podium-placeholder-title">{t("podiumUnclaimed")}</p>
				<p className="podium-placeholder-hint">{t("podiumCouldBeYours")}</p>
			</div>
		</div>
	);
}

function PodiumClaimButton({
	rank,
	onClaimRank,
	onPreviewRank,
}: {
	rank: 1 | 2 | 3;
	onClaimRank: (rank: number) => void;
	onPreviewRank: (rank: number | null) => void;
}) {
	const { t } = useLocale();
	return (
		<button
			type="button"
			className={`podium-claim-button podium-claim-button--rank-${rank}`}
			aria-label={t("claim", { rank })}
			onMouseEnter={() => onPreviewRank(rank)}
			onMouseLeave={() => onPreviewRank(null)}
			onFocus={() => onPreviewRank(rank)}
			onBlur={() => onPreviewRank(null)}
			onClick={() => onClaimRank(rank)}
		>
			<span className="podium-claim-idle">#{rank}</span>
			<span className="podium-claim-action">{t("claim", { rank })}</span>
		</button>
	);
}

function PodiumCard({
	product,
	rank,
	onClaimRank,
	onPreviewRank,
}: {
	product: Product;
	rank: 1 | 2 | 3;
	onClaimRank: (rank: number) => void;
	onPreviewRank: (rank: number | null) => void;
}) {
	const { t, currency, number } = useLocale();
	return (
		<div className={`podium-card podium-card--rank-${rank}`}>
			<div className="podium-card-header">
				<PodiumClaimButton rank={rank} onClaimRank={onClaimRank} onPreviewRank={onPreviewRank} />
				<div className="podium-card-stats">
					<strong className="product-price">{currency.format(product.totalPaidSen / 100)}</strong>
					<span className="podium-card-clicks">{formatClicks(product.clickCount, number, t)}</span>
				</div>
			</div>
			<ProductLink product={product} className="podium-card-link">
				<img src={product.faviconUrl} alt="" />
				<ProductCopy product={product} />
			</ProductLink>
		</div>
	);
}

function LeaderboardRow({
	product,
	onClaimRank,
	onPreviewRank,
}: {
	product: Product;
	onClaimRank: (rank: number) => void;
	onPreviewRank: (rank: number | null) => void;
}) {
	const { t, currency, number } = useLocale();
	const rankClass = product.rank >= 1 && product.rank <= 3 ? ` leaderboard-row--rank-${product.rank}` : "";
	return (
		<ProductLink product={product} className={`leaderboard-row${rankClass}`}>
			<img src={product.faviconUrl} alt="" />
			<LeaderboardRowCopy product={product} onClaimRank={onClaimRank} onPreviewRank={onPreviewRank} />
			<div className="leaderboard-row-stats">
				<strong className="product-price">{currency.format(product.totalPaidSen / 100)}</strong>
				<span className="leaderboard-row-clicks">{formatClicks(product.clickCount, number, t)}</span>
			</div>
		</ProductLink>
	);
}

function LeaderboardPlaceholder({
	rank,
	onClaimRank,
	onPreviewRank,
}: {
	rank: 1 | 2 | 3;
	onClaimRank: (rank: number) => void;
	onPreviewRank: (rank: number | null) => void;
}) {
	const { t } = useLocale();
	return (
		<div className={`leaderboard-row leaderboard-row--empty leaderboard-row--rank-${rank}`} aria-label={`${t("rankAvailable", { rank })}. ${t("podiumUnclaimed")} ${t("podiumCouldBeYours")}`}>
			<span className="leaderboard-row-empty-mark" aria-hidden="true">?</span>
			<div className="leaderboard-row-copy">
				<div className="leaderboard-row-title">
					<span className="product-domain">{t("podiumUnclaimed")}</span>
					<RankChip rank={rank} onClaimRank={onClaimRank} onPreviewRank={onPreviewRank} />
				</div>
				<p className="product-description">{t("podiumCouldBeYours")}</p>
			</div>
		</div>
	);
}

function formatContributionBoard(sen: number) {
	return `RM ${Math.max(0, Math.round(sen / 100))}`;
}

function TotalContribution({ sen }: { sen: number }) {
	const { t } = useLocale();
	const formatted = formatContributionBoard(sen);
	const zeroed = formatContributionBoard(0);

	return (
		<div className="total-contribution">
			<p className="total-contribution-label">{t("totalContribution")}</p>
			<SplitFlapText
				words={formatted === zeroed ? [formatted] : [zeroed, formatted]}
				loop={false}
				charset="0123456789RM "
				padTo={Math.max(formatted.length, zeroed.length)}
				flipDuration={0.1}
				stagger={0.05}
				cycleDelay={480}
				flipsPerChar={5}
				tileColor="#211b17"
				textColor="#fff8ef"
				tileRadius={8}
				gap={6}
				fontSize={48}
			/>
		</div>
	);
}

function Leaderboard({
	products,
	trending,
	latest,
	totalRaisedSen,
	onClaimRank,
	onPreviewRank,
}: {
	products: Product[];
	trending: TrendingSite[];
	latest: LatestPayment[];
	totalRaisedSen: number;
	onClaimRank: (rank: number) => void;
	onPreviewRank: (rank: number | null) => void;
}) {
	const showPodium = true;
	const rest = products.filter((product) => product.rank > 3);
	const { t, currency, number } = useLocale();
	const podiumOrder = [2, 1, 3] as const;
	const topRanks = [1, 2, 3] as const;
	const showTrending = showPodium && trending.length > 0;
	const showLatest = showPodium && latest.length > 0;
	const showRails = showTrending || showLatest;
	const showRows = rest.length > 0 || showPodium;
	const SHOW_TOTAL_CONTRIBUTION = false;

	return (
		<div className="leaderboard">
			{showPodium && (
				<div className="leaderboard-podium-wrap">
					<div className="podium">
						{podiumOrder.map((rank) => {
							const product = products.find((entry) => entry.rank === rank);
							if (!product) return <PodiumPlaceholder key={rank} rank={rank} />;
							return <PodiumCard key={product.id} product={product} rank={rank} onClaimRank={onClaimRank} onPreviewRank={onPreviewRank} />;
						})}
					</div>
				</div>
			)}

			{(showRails || showRows) && (
			<div className={`leaderboard-body${showRails ? " leaderboard-body--rails" : ""}`}>
				{showTrending ? (
					<section className="activity-panel activity-panel--trending" aria-labelledby="trending-heading">
						<h2 id="trending-heading">
							<img className="activity-heading-icon" src={trendingFire} alt="" />
							{t("trendingTitle")}
						</h2>
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
					</section>
				) : showRails ? (
					<div />
				) : null}

				{showRows ? (
					<div className={`leaderboard-rows${rest.length === 0 ? " leaderboard-rows--top-only" : ""}`}>
						{showPodium ? (
							<div className="leaderboard-top-list">
								{topRanks.map((rank, index) => {
									const product = products.find((entry) => entry.rank === rank);
									return (
										<Fragment key={`top-${rank}`}>
											{index > 0 ? <Separator /> : null}
											{product ? (
											<LeaderboardRow product={product} onClaimRank={onClaimRank} onPreviewRank={onPreviewRank} />
										) : (
											<LeaderboardPlaceholder rank={rank} onClaimRank={onClaimRank} onPreviewRank={onPreviewRank} />
											)}
										</Fragment>
									);
								})}
								{rest.length > 0 ? <Separator /> : null}
							</div>
						) : null}
						{rest.map((product, index) => (
							<Fragment key={product.id}>
								{index > 0 ? <Separator /> : null}
								<LeaderboardRow product={product} onClaimRank={onClaimRank} onPreviewRank={onPreviewRank} />
							</Fragment>
						))}
					</div>
				) : showRails ? (
					<div />
				) : null}

				{showLatest ? (
					<section className="activity-panel activity-panel--latest" aria-labelledby="latest-heading">
						<h2 id="latest-heading">
							<Clock className="activity-heading-icon" aria-hidden="true" />
							{t("latestActivityTitle")}
						</h2>
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
					</section>
				) : showRails ? (
					<div />
				) : null}
			</div>
			)}

			{SHOW_TOTAL_CONTRIBUTION ? <TotalContribution sen={totalRaisedSen} /> : null}
		</div>
	);
}

function App() {
	const { t } = useLocale();
	const isStatsPage = window.location.pathname === "/stats";
	const [products, setProducts] = useState<Product[]>([]);
	const [productTotal, setProductTotal] = useState(0);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [totalRaisedSen, setTotalRaisedSen] = useState(0);
	const [rankingProducts, setRankingProducts] = useState<Product[]>([]);
	const [trending, setTrending] = useState<TrendingSite[]>([]);
	const [latest, setLatest] = useState<LatestPayment[]>([]);
	const loadMoreRef = useRef<HTMLDivElement>(null);
	const [url, setUrl] = useState("");
	const urlInputRef = useRef<HTMLInputElement>(null);
	const [bidSen, setBidSen] = useState(MINIMUM_SEN);
	const [bidInput, setBidInput] = useState(formatBidInput(MINIMUM_SEN));
	const [rankInput, setRankInput] = useState("1");
	const [hoveredRank, setHoveredRank] = useState<number | null>(null);
	const updatingFromRank = useRef(false);
	const [errorKey, setErrorKey] = useState<"loadLeaderboardError" | "checkoutCancelled" | "checkoutCancelProcessing" | "checkoutStartError" | null>(null);
	const [errorRaw, setErrorRaw] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const useLiveLeaderboard = import.meta.env.DEV && new URLSearchParams(window.location.search).get("live") === "1";
	const showDemoLeaderboard = import.meta.env.DEV && !useLiveLeaderboard;

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
		if (showDemoLeaderboard) return;

		let cancelled = false;
		setProducts([]);
		setProductTotal(0);
		setIsLoadingMore(true);
		void fetch(`/api/products?limit=${PAGE_SIZE}&offset=0`)
			.then((response) => response.json() as Promise<{ products: Product[]; total: number; totalRaisedSen?: number }>)
			.then((productData) => {
				if (cancelled) return;
				setProducts(productData.products);
				setProductTotal(productData.total);
				if (typeof productData.totalRaisedSen === "number") setTotalRaisedSen(productData.totalRaisedSen);
			})
			.catch(() => {
				if (!cancelled) showTranslatedError("loadLeaderboardError");
			})
			.finally(() => {
				if (!cancelled) setIsLoadingMore(false);
			});
		return () => {
			cancelled = true;
		};
	}, [isStatsPage, showDemoLeaderboard]);

	useEffect(() => {
		if (isStatsPage) return;
		if (showDemoLeaderboard) return;

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
	}, [isStatsPage, showDemoLeaderboard]);

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
	const displayProducts = showDemoLeaderboard ? DEMO_PRODUCTS : products;
	const displayTrending = showDemoLeaderboard ? DEMO_TRENDING : trending;
	const displayLatest = showDemoLeaderboard ? DEMO_LATEST : latest;
	const displayRaisedSen = showDemoLeaderboard ? DEMO_RAISED_SEN : totalRaisedSen;
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
	const projectedRank = useMemo(
		() => projectRank(effectiveBidSen, rankingTotalsForBid),
		[effectiveBidSen, rankingTotalsForBid],
	);
	const maxRank = Math.max(rankingTotalsForBid.length + 1, 1);
	const parsedRankInput = Number(rankInput);
	const claimRank =
		rankInput.trim() !== "" && Number.isFinite(parsedRankInput)
			? normalizeRankInput(parsedRankInput, maxRank)
			: projectedRank;
	const rankPreview = useMemo(() => {
		if (hoveredRank == null) return null;
		return claimPreviewForRank(
			normalizeRankInput(hoveredRank, maxRank),
			rankingTotalsForBid,
			{
				excludeTotalSen: matchedListing?.totalPaidSen ?? null,
				minimumSen: MINIMUM_SEN,
			},
		);
	}, [hoveredRank, matchedListing?.totalPaidSen, maxRank, rankingTotalsForBid]);
	const displayedRankInput = rankPreview ? String(rankPreview.rank) : rankInput;
	const displayedBidInput = rankPreview ? formatBidInput(rankPreview.bidSen) : bidInput;
	const displayedClaimRank = rankPreview?.rank ?? claimRank;

	function commitRankInput(rawValue = rankInput) {
		const nextRank = normalizeRankInput(Number(rawValue), maxRank);
		const preview = claimPreviewForRank(nextRank, rankingTotalsForBid, {
			excludeTotalSen: matchedListing?.totalPaidSen ?? null,
			minimumSen: MINIMUM_SEN,
		});
		updatingFromRank.current = true;
		setBidSen(preview.bidSen);
		setBidInput(formatBidInput(preview.bidSen));
		setRankInput(String(nextRank));
		return nextRank;
	}

	function claimSpot(rank: number) {
		commitRankInput(String(rank));
		const field = urlInputRef.current;
		field?.focus({ preventScroll: true });
		field?.scrollIntoView({ behavior: "smooth", block: "center" });
	}

	useEffect(() => {
		if (updatingFromRank.current) {
			updatingFromRank.current = false;
			return;
		}
		setRankInput(String(projectedRank));
	}, [projectedRank]);

	const hasMoreProducts = !showDemoLeaderboard && productTotal > products.length;

	useEffect(() => {
		const sentinel = loadMoreRef.current;
		if (isStatsPage || !sentinel || !hasMoreProducts || isLoadingMore) return;

		const observer = new IntersectionObserver((entries) => {
			if (!entries[0]?.isIntersecting) return;
			observer.unobserve(sentinel);
			setIsLoadingMore(true);
			const offset = products.length;
			void fetch(`/api/products?limit=${PAGE_SIZE}&offset=${offset}`)
				.then((response) => {
					if (!response.ok) throw new Error("Unable to load more products");
					return response.json() as Promise<{ products: Product[]; total: number }>;
				})
				.then((productData) => {
					setProducts((current) => appendLeaderboardPage(current, productData.products));
					setProductTotal(productData.total);
				})
				.catch(() => showTranslatedError("loadLeaderboardError"))
				.finally(() => setIsLoadingMore(false));
		});

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasMoreProducts, isLoadingMore, isStatsPage, products.length]);

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
									value={displayedRankInput}
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
										value={displayedBidInput}
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
								ref={urlInputRef}
								required
								type="text"
								inputMode="url"
								placeholder={t("productUrlPlaceholder")}
								value={url}
								onChange={(event) => setUrl(event.target.value)}
							/>
						</label>
						<button type="submit" disabled={isSubmitting}>
							{isSubmitting ? t("opening") : t("claim", { rank: displayedClaimRank })}
						</button>
					</div>
					{(errorRaw || errorKey) && <p className="form-error">{errorRaw || (errorKey ? t(errorKey) : "")}</p>}
				</form>

				<Leaderboard
					products={displayProducts}
					trending={displayTrending}
					latest={displayLatest}
					totalRaisedSen={displayRaisedSen}
					onClaimRank={claimSpot}
					onPreviewRank={setHoveredRank}
				/>
				{hasMoreProducts ? <div ref={loadMoreRef} className="leaderboard-load-more" aria-hidden="true" /> : null}
			</section>
			<Footer />
		</main>
	);
}

export default App;

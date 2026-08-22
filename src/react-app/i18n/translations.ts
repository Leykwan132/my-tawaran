export const LOCALES = [
	{ id: "ms", label: "BM", htmlLang: "ms" },
	{ id: "en", label: "EN", htmlLang: "en" },
	{ id: "zh", label: "中文", htmlLang: "zh-Hans" },
] as const;

export type Locale = (typeof LOCALES)[number]["id"];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_STORAGE_KEY = "mytawaran-locale";

type Messages = {
	documentTitle: string;
	navMain: string;
	navLeaderboard: string;
	navStats: string;
	language: string;
	aboutTrigger: string;
	aboutTitle: string;
	aboutDescription: string;
	aboutRules: Array<{ title: string; description: string }>;
	heroClaim: string;
	heroFor: string;
	targetRank: string;
	decreaseBid: string;
	increaseBid: string;
	bidAmount: string;
	websiteUrl: string;
	productUrlPlaceholder: string;
	claim: string;
	opening: string;
	claimSummary: string;
	yourProduct: string;
	clicksOne: string;
	clicksMany: string;
	rankAvailable: string;
	loadLeaderboardError: string;
	checkoutCancelled: string;
	checkoutCancelProcessing: string;
	checkoutStartError: string;
	raisedSoFar: string;
	statsEyebrow: string;
	statsTitle: string;
	statsDescription: string;
	statsEmptyTitle: string;
	statsEmptyBody: string;
	statsIframeTitle: string;
	paginationAria: string;
	paginationPrevious: string;
	paginationNext: string;
	paginationMore: string;
	paginationPrevAria: string;
	paginationNextAria: string;
	paginationSummary: string;
};

export const translations: Record<Locale, Messages> = {
	en: {
		documentTitle: "mytawaran — claim your corner of the internet",
		navMain: "Main navigation",
		navLeaderboard: "Leaderboard",
		navStats: "Stats",
		language: "Language",
		aboutTrigger: "What is mytawaran?",
		aboutTitle: "What is MyTawaran?",
		aboutDescription: "A paid leaderboard for Malaysian products. Pay to claim rank, outbid others, and drive traffic to your site. Minimum bid is RM2.",
		aboutRules: [
			{
				title: "Claim your spot",
				description: "Enter your product URL and choose how much you want on the board. Minimum bid is RM2.",
			},
			{
				title: "Rank by contribution",
				description: "Higher totals rank higher. The top 3 sit on the podium; everyone else appears in the list below.",
			},
			{
				title: "Top up to move up",
				description: "Already listed? You only pay the difference to reach your new target rank.",
			},
			{
				title: "Get the clicks",
				description: "Each listing links straight to your site. Clicks are tracked so you can see what the board sends you.",
			},
		],
		heroClaim: "Claim",
		heroFor: "for",
		targetRank: "Target rank",
		decreaseBid: "Decrease bid",
		increaseBid: "Increase bid",
		bidAmount: "Bid amount in MYR",
		websiteUrl: "Website URL",
		productUrlPlaceholder: "Your product URL",
		claim: "Claim",
		opening: "Opening…",
		claimSummary: "Tawarkan {domain} at #{rank} for {amount}.",
		yourProduct: "your product",
		clicksOne: "{count} click",
		clicksMany: "{count} clicks",
		rankAvailable: "Rank {rank} available",
		loadLeaderboardError: "Unable to load the live leaderboard.",
		checkoutCancelled: "Checkout cancelled. No placement was changed.",
		checkoutCancelProcessing: "Checkout cancellation is still processing. Reload to retry.",
		checkoutStartError: "Unable to start checkout.",
		raisedSoFar: "{amount} raised so far",
		statsEyebrow: "MyTawaran analytics",
		statsTitle: "How the board is moving.",
		statsDescription: "Traffic and outbound website clicks are measured with PostHog.",
		statsEmptyTitle: "Stats are nearly ready.",
		statsEmptyBody: "Set VITE_PUBLIC_POSTHOG_DASHBOARD_EMBED_URL to the public PostHog dashboard embed URL.",
		statsIframeTitle: "MyTawaran stats",
		paginationAria: "Pagination",
		paginationPrevious: "Previous",
		paginationNext: "Next",
		paginationMore: "More pages",
		paginationPrevAria: "Go to previous page",
		paginationNextAria: "Go to next page",
		paginationSummary: "Showing {start}–{end} of {total}",
	},
	ms: {
		documentTitle: "mytawaran — tuntut sudut internet anda",
		navMain: "Navigasi utama",
		navLeaderboard: "Kedudukan",
		navStats: "Statistik",
		language: "Bahasa",
		aboutTrigger: "Apa itu mytawaran?",
		aboutTitle: "Apa itu MyTawaran?",
		aboutDescription: "Papan kedudukan berbayar untuk produk Malaysia. Bayar untuk tuntut ranking, atasi tawaran lain, dan hantar trafik ke tapak anda. Tawaran minimum ialah RM2.",
		aboutRules: [
			{
				title: "Tuntut tempat anda",
				description: "Masukkan URL produk dan pilih jumlah di papan. Tawaran minimum ialah RM2.",
			},
			{
				title: "Ranking mengikut sumbangan",
				description: "Jumlah lebih tinggi, ranking lebih tinggi. 3 teratas di podium; yang lain dalam senarai di bawah.",
			},
			{
				title: "Tambah nilai untuk naik",
				description: "Sudah tersenarai? Anda hanya bayar beza untuk mencapai ranking sasaran baharu.",
			},
			{
				title: "Dapatkan klik",
				description: "Setiap senarai paut terus ke tapak anda. Klik dijejak supaya anda nampak apa yang papan hantar.",
			},
		],
		heroClaim: "Tuntut",
		heroFor: "dengan",
		targetRank: "Ranking sasaran",
		decreaseBid: "Kurangkan tawaran",
		increaseBid: "Tambah tawaran",
		bidAmount: "Jumlah tawaran dalam MYR",
		websiteUrl: "URL tapak web",
		productUrlPlaceholder: "URL produk anda",
		claim: "Tuntut",
		opening: "Membuka…",
		claimSummary: "Tawarkan {domain} di #{rank} dengan {amount}.",
		yourProduct: "produk anda",
		clicksOne: "{count} klik",
		clicksMany: "{count} klik",
		rankAvailable: "Ranking {rank} masih kosong",
		loadLeaderboardError: "Tidak dapat memuatkan papan kedudukan langsung.",
		checkoutCancelled: "Pembayaran dibatalkan. Tiada kedudukan diubah.",
		checkoutCancelProcessing: "Pembatalan pembayaran masih diproses. Muat semula untuk cuba lagi.",
		checkoutStartError: "Tidak dapat mulakan pembayaran.",
		raisedSoFar: "{amount} dikumpul setakat ini",
		statsEyebrow: "Analitik MyTawaran",
		statsTitle: "Bagaimana papan sedang bergerak.",
		statsDescription: "Trafik dan klik keluar ke tapak web diukur dengan PostHog.",
		statsEmptyTitle: "Statistik hampir sedia.",
		statsEmptyBody: "Tetapkan VITE_PUBLIC_POSTHOG_DASHBOARD_EMBED_URL kepada URL embed papan pemuka PostHog awam.",
		statsIframeTitle: "Statistik MyTawaran",
		paginationAria: "Penomboran halaman",
		paginationPrevious: "Sebelum",
		paginationNext: "Seterusnya",
		paginationMore: "Lagi halaman",
		paginationPrevAria: "Ke halaman sebelumnya",
		paginationNextAria: "Ke halaman seterusnya",
		paginationSummary: "Menunjukkan {start}–{end} daripada {total}",
	},
	zh: {
		documentTitle: "mytawaran — 抢占你的网络一席",
		navMain: "主导航",
		navLeaderboard: "排行榜",
		navStats: "数据",
		language: "语言",
		aboutTrigger: "什么是 mytawaran？",
		aboutTitle: "什么是 MyTawaran？",
		aboutDescription: "面向马来西亚产品的付费排行榜。付款抢占排名，出价超过他人，为你的网站带来流量。最低出价为 RM2。",
		aboutRules: [
			{
				title: "抢占席位",
				description: "输入产品网址并选择上榜金额。最低出价为 RM2。",
			},
			{
				title: "按贡献排名",
				description: "总额越高排名越前。前三名登上领奖台，其余显示在下方列表。",
			},
			{
				title: "加码即可上升",
				description: "已经上榜？只需补差价即可达到新的目标排名。",
			},
			{
				title: "获得点击",
				description: "每条榜单直接链到你的网站。点击会被追踪，方便你查看榜单带来的流量。",
			},
		],
		heroClaim: "抢占",
		heroFor: "出价",
		targetRank: "目标排名",
		decreaseBid: "降低出价",
		increaseBid: "提高出价",
		bidAmount: "出价金额（马币）",
		websiteUrl: "网站网址",
		productUrlPlaceholder: "你的产品网址",
		claim: "抢占",
		opening: "正在打开…",
		claimSummary: "为 {domain} 抢占 #{rank}，出价 {amount}。",
		yourProduct: "你的产品",
		clicksOne: "{count} 次点击",
		clicksMany: "{count} 次点击",
		rankAvailable: "第 {rank} 名可抢占",
		loadLeaderboardError: "无法加载实时排行榜。",
		checkoutCancelled: "已取消结账。排名未被更改。",
		checkoutCancelProcessing: "取消结账仍在处理中。请刷新后重试。",
		checkoutStartError: "无法开始结账。",
		raisedSoFar: "至今已筹集 {amount}",
		statsEyebrow: "MyTawaran 数据分析",
		statsTitle: "排行榜正在如何变化。",
		statsDescription: "流量与外链点击由 PostHog 统计。",
		statsEmptyTitle: "数据面板即将就绪。",
		statsEmptyBody: "请将 VITE_PUBLIC_POSTHOG_DASHBOARD_EMBED_URL 设为公开的 PostHog 仪表板嵌入网址。",
		statsIframeTitle: "MyTawaran 数据",
		paginationAria: "分页",
		paginationPrevious: "上一页",
		paginationNext: "下一页",
		paginationMore: "更多页",
		paginationPrevAria: "前往上一页",
		paginationNextAria: "前往下一页",
		paginationSummary: "显示第 {start}–{end} 项，共 {total} 项",
	},
};

export const INTL_LOCALE: Record<Locale, string> = {
	en: "en-MY",
	ms: "ms-MY",
	zh: "zh-Hans-MY",
};

export function interpolate(template: string, vars: Record<string, string | number>) {
	if (typeof template !== "string") return template;
	return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function isLocale(value: string | null): value is Locale {
	return value === "en" || value === "ms" || value === "zh";
}

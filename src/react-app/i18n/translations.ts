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
	navMenuOpen: string;
	navMenuClose: string;
	navLeaderboard: string;
	navStats: string;
	language: string;
	aboutTrigger: string;
	aboutTitle: string;
	aboutDescription: string;
	aboutRules: Array<{ title: string; description: string }>;
	aboutTopUpNote: string;
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
	clicksOne: string;
	clicksMany: string;
	rankAvailable: string;
	podiumUnclaimed: string;
	podiumCouldBeYours: string;
	loadLeaderboardError: string;
	checkoutCancelled: string;
	checkoutCancelProcessing: string;
	checkoutStartError: string;
	listingsOne: string;
	listingsMany: string;
	totalContribution: string;
	trendingTitle: string;
	latestActivityTitle: string;
	clicksPerHour: string;
	clicksPerHourOne: string;
	statsEyebrow: string;
	statsTitle: string;
	statsDescription: string;
	statsEmptyTitle: string;
	statsEmptyBody: string;
	statsLoadError: string;
	statsRangeLabel: string;
	statsRange24h: string;
	statsRange7d: string;
	statsRequests: string;
	statsVisits: string;
	statsBandwidth: string;
	statsErrorRate: string;
	statsTrafficTitle: string;
	statsCountriesTitle: string;
	statsPathsTitle: string;
	statsRequestsSeries: string;
	statsVisitsSeries: string;
	paginationAria: string;
	paginationPrevious: string;
	paginationNext: string;
	paginationMore: string;
	paginationPrevAria: string;
	paginationNextAria: string;
	paginationSummary: string;
	footerBuiltProudly: string;
	footerAndBy: string;
};

export const translations: Record<Locale, Messages> = {
	en: {
		documentTitle: "mytawaran — claim your corner of the internet",
		navMain: "Main navigation",
		navMenuOpen: "Open menu",
		navMenuClose: "Close menu",
		navLeaderboard: "Home",
		navStats: "Stats",
		language: "Language",
		aboutTrigger: "What is mytawaran?",
		aboutTitle: "What is MyTawaran?",
		aboutDescription: "Offer your product. Minimum RM2. If your spot has been claimed, reclaim it by paying only the difference!",
		aboutRules: [
			{
				title: "Set the rank or the amount",
				description: "Choose the rank you want, or how much you want to pay. Minimum bid is RM2.",
			},
			{
				title: "Enter product URL",
				description: "Paste the website you want on the board.",
			},
			{
				title: "Claim!",
				description: "Pay to lock in that spot.",
			},
		],
		aboutTopUpNote: "If you're moving up with the same product, you only pay the difference to move up.",
		heroClaim: "Claim",
		heroFor: "for",
		targetRank: "Target rank",
		decreaseBid: "Decrease bid",
		increaseBid: "Increase bid",
		bidAmount: "Bid amount in MYR",
		websiteUrl: "Website URL",
		productUrlPlaceholder: "Your product URL",
		claim: "Claim #{rank}",
		opening: "Opening…",
		clicksOne: "{count} click",
		clicksMany: "{count} clicks",
		rankAvailable: "Rank {rank} available",
		podiumUnclaimed: "No one claimed it yet.",
		podiumCouldBeYours: "It could be yours.",
		loadLeaderboardError: "Unable to load the live leaderboard.",
		checkoutCancelled: "Checkout cancelled. No placement was changed.",
		checkoutCancelProcessing: "Checkout cancellation is still processing. Reload to retry.",
		checkoutStartError: "Unable to start checkout.",
		listingsOne: "{count} other has tawared",
		listingsMany: "{count} others have tawared",
		totalContribution: "Total Tawared so far",
		trendingTitle: "Trending",
		latestActivityTitle: "Latest activity",
		clicksPerHourOne: "{count} click / hour",
		clicksPerHour: "{count} clicks / hour",
		statsEyebrow: "Cloudflare analytics",
		statsTitle: "How the data is moving.",
		statsDescription: "Live edge traffic for mytawaran.com from the Cloudflare GraphQL Analytics API.",
		statsEmptyTitle: "Analytics token missing.",
		statsEmptyBody: "Set CF_ANALYTICS_API_TOKEN (Zone Analytics Read) in .dev.vars or as a Worker secret.",
		statsLoadError: "Unable to load Cloudflare analytics.",
		statsRangeLabel: "Time range",
		statsRange24h: "24 hours",
		statsRange7d: "7 days",
		statsRequests: "Requests",
		statsVisits: "Visits",
		statsBandwidth: "Bandwidth",
		statsErrorRate: "4xx / 5xx",
		statsTrafficTitle: "Requests and visits",
		statsCountriesTitle: "Top countries",
		statsPathsTitle: "Top paths",
		statsRequestsSeries: "Requests",
		statsVisitsSeries: "Visits",
		paginationAria: "Pagination",
		paginationPrevious: "Previous",
		paginationNext: "Next",
		paginationMore: "More pages",
		paginationPrevAria: "Go to previous page",
		paginationNextAria: "Go to next page",
		paginationSummary: "Showing {start}–{end} of {total}",
		footerBuiltProudly: "Built proudly in",
		footerAndBy: "and by",
	},
	ms: {
		documentTitle: "mytawaran — tuntut sudut internet anda",
		navMain: "Navigasi utama",
		navMenuOpen: "Buka menu",
		navMenuClose: "Tutup menu",
		navLeaderboard: "Utama",
		navStats: "Statistik",
		language: "Bahasa",
		aboutTrigger: "Apa itu mytawaran?",
		aboutTitle: "Apa itu MyTawaran?",
		aboutDescription: "Tawarkan produk anda. Minimum RM2. Jika spot anda telah dituntut, tuntut semula dengan hanya membayar perbezaannya!",
		aboutRules: [
			{
				title: "Tetapkan ranking atau jumlah",
				description: "Pilih ranking yang anda mahu, atau berapa yang anda mahu bayar. Tawaran minimum ialah RM2.",
			},
			{
				title: "Masukkan URL produk",
				description: "Tampal tapak web yang anda mahu di papan.",
			},
			{
				title: "Tuntut!",
				description: "Bayar untuk kunci tempat itu.",
			},
		],
		aboutTopUpNote: "Jika anda naik dengan produk yang sama, anda hanya bayar beza untuk naik.",
		heroClaim: "Tuntut",
		heroFor: "dengan",
		targetRank: "Ranking sasaran",
		decreaseBid: "Kurangkan tawaran",
		increaseBid: "Tambah tawaran",
		bidAmount: "Jumlah tawaran dalam MYR",
		websiteUrl: "URL tapak web",
		productUrlPlaceholder: "URL produk anda",
		claim: "Tuntut #{rank}",
		opening: "Membuka…",
		clicksOne: "{count} klik",
		clicksMany: "{count} klik",
		rankAvailable: "Ranking {rank} masih kosong",
		podiumUnclaimed: "Belum ada yang tuntut.",
		podiumCouldBeYours: "Ini boleh jadi milik anda.",
		loadLeaderboardError: "Tidak dapat memuatkan papan kedudukan langsung.",
		checkoutCancelled: "Pembayaran dibatalkan. Tiada kedudukan diubah.",
		checkoutCancelProcessing: "Pembatalan pembayaran masih diproses. Muat semula untuk cuba lagi.",
		checkoutStartError: "Tidak dapat mulakan pembayaran.",
		listingsOne: "{count} yang lain telah tawar",
		listingsMany: "{count} yang lain telah tawar",
		totalContribution: "Jumlah ditawarkan setakat ini",
		trendingTitle: "Sedang hangat",
		latestActivityTitle: "Aktiviti terkini",
		clicksPerHourOne: "{count} klik / jam",
		clicksPerHour: "{count} klik / jam",
		statsEyebrow: "Analitik Cloudflare",
		statsTitle: "Bagaimana data sedang bergerak.",
		statsDescription: "Trafik tepi langsung untuk mytawaran.com daripada API Analitik GraphQL Cloudflare.",
		statsEmptyTitle: "Token analitik tiada.",
		statsEmptyBody: "Tetapkan CF_ANALYTICS_API_TOKEN (Zone Analytics Read) dalam .dev.vars atau sebagai rahsia Worker.",
		statsLoadError: "Tidak dapat memuatkan analitik Cloudflare.",
		statsRangeLabel: "Julat masa",
		statsRange24h: "24 jam",
		statsRange7d: "7 hari",
		statsRequests: "Permintaan",
		statsVisits: "Lawatan",
		statsBandwidth: "Lebar jalur",
		statsErrorRate: "4xx / 5xx",
		statsTrafficTitle: "Permintaan dan lawatan",
		statsCountriesTitle: "Negara teratas",
		statsPathsTitle: "Laluan teratas",
		statsRequestsSeries: "Permintaan",
		statsVisitsSeries: "Lawatan",
		paginationAria: "Penomboran halaman",
		paginationPrevious: "Sebelum",
		paginationNext: "Seterusnya",
		paginationMore: "Lagi halaman",
		paginationPrevAria: "Ke halaman sebelumnya",
		paginationNextAria: "Ke halaman seterusnya",
		paginationSummary: "Menunjukkan {start}–{end} daripada {total}",
		footerBuiltProudly: "Dibina dengan bangga di",
		footerAndBy: "dan oleh",
	},
	zh: {
		documentTitle: "mytawaran — 抢占你的网络一席",
		navMain: "主导航",
		navMenuOpen: "打开菜单",
		navMenuClose: "关闭菜单",
		navLeaderboard: "首页",
		navStats: "数据",
		language: "语言",
		aboutTrigger: "什么是 mytawaran？",
		aboutTitle: "什么是 MyTawaran？",
		aboutDescription: "推广您的产品。最低 RM2。若您的名额已被占用，只需支付差额即可重新夺回！",
		aboutRules: [
			{
				title: "设定排名或金额",
				description: "选择目标排名，或你想支付的金额。最低出价为 RM2。",
			},
			{
				title: "输入产品网址",
				description: "粘贴你想上榜的网站。",
			},
			{
				title: "抢占！",
				description: "付款锁定该席位。",
			},
		],
		aboutTopUpNote: "同一产品往上爬时，只需补差价即可上升。",
		heroClaim: "抢占",
		heroFor: "出价",
		targetRank: "目标排名",
		decreaseBid: "降低出价",
		increaseBid: "提高出价",
		bidAmount: "出价金额（马币）",
		websiteUrl: "网站网址",
		productUrlPlaceholder: "你的产品网址",
		claim: "抢占 #{rank}",
		opening: "正在打开…",
		clicksOne: "{count} 次点击",
		clicksMany: "{count} 次点击",
		rankAvailable: "第 {rank} 名可抢占",
		podiumUnclaimed: "还没人抢占。",
		podiumCouldBeYours: "这席位可以是你的。",
		loadLeaderboardError: "无法加载实时排行榜。",
		checkoutCancelled: "已取消结账。排名未被更改。",
		checkoutCancelProcessing: "取消结账仍在处理中。请刷新后重试。",
		checkoutStartError: "无法开始结账。",
		listingsOne: "已有 {count} 人出价",
		listingsMany: "已有 {count} 人出价",
		totalContribution: "至今总出价",
		trendingTitle: "热门",
		latestActivityTitle: "最新动态",
		clicksPerHourOne: "{count} 次点击 / 小时",
		clicksPerHour: "{count} 次点击 / 小时",
		statsEyebrow: "Cloudflare 分析",
		statsTitle: "数据正在如何变化。",
		statsDescription: "来自 Cloudflare GraphQL Analytics API 的 mytawaran.com 边缘流量。",
		statsEmptyTitle: "缺少分析令牌。",
		statsEmptyBody: "请在 .dev.vars 或 Worker secret 中设置 CF_ANALYTICS_API_TOKEN（Zone Analytics Read）。",
		statsLoadError: "无法加载 Cloudflare 分析。",
		statsRangeLabel: "时间范围",
		statsRange24h: "24 小时",
		statsRange7d: "7 天",
		statsRequests: "请求",
		statsVisits: "访问",
		statsBandwidth: "带宽",
		statsErrorRate: "4xx / 5xx",
		statsTrafficTitle: "请求与访问",
		statsCountriesTitle: "热门国家",
		statsPathsTitle: "热门路径",
		statsRequestsSeries: "请求",
		statsVisitsSeries: "访问",
		paginationAria: "分页",
		paginationPrevious: "上一页",
		paginationNext: "下一页",
		paginationMore: "更多页",
		paginationPrevAria: "前往上一页",
		paginationNextAria: "前往下一页",
		paginationSummary: "显示第 {start}–{end} 项，共 {total} 项",
		footerBuiltProudly: "自豪地诞生于",
		footerAndBy: "由",
	},
};

export const INTL_LOCALE: Record<Locale, string> = {
	en: "en-MY",
	ms: "ms-MY",
	zh: "zh-Hans-MY",
};

export function interpolate(template: string, vars: Record<string, string | number>) {
	return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function isLocale(value: string | null): value is Locale {
	return value === "en" || value === "ms" || value === "zh";
}

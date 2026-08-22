export type Product = {
	id: string;
	domain: string;
	url: string;
	faviconUrl: string;
	description: string;
	clickCount: number;
	totalPaidSen: number;
	rank: number;
};

function faviconFor(domain: string) {
	return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

const DEMO_SEEDS: Array<{ domain: string; description: string }> = [
	{ domain: "linear.app", description: "The issue tracking tool you'll enjoy using for product, engineering, and design teams." },
	{ domain: "figma.com", description: "Collaborative interface design for product teams." },
	{ domain: "notion.so", description: "Notes, docs, and wikis in one workspace." },
	{ domain: "stripe.com", description: "Payments infrastructure for the internet." },
	{ domain: "vercel.com", description: "Build and deploy modern web apps." },
	{ domain: "supabase.com", description: "Open source Firebase alternative with Postgres." },
	{ domain: "openai.com", description: "AI research and products including ChatGPT." },
	{ domain: "anthropic.com", description: "AI safety company behind Claude." },
	{ domain: "github.com", description: "Where the world builds software." },
	{ domain: "cursor.com", description: "The AI code editor." },
	{ domain: "grab.com", description: "Superapp for rides, food, and payments across Southeast Asia." },
	{ domain: "shopee.com.my", description: "Malaysia's go-to online marketplace." },
	{ domain: "lazada.com.my", description: "Online shopping and next-day delivery in Malaysia." },
	{ domain: "foodpanda.my", description: "Food and grocery delivery across Malaysian cities." },
	{ domain: "tngdigital.com.my", description: "Touch 'n Go eWallet for payments, rides, and transfers." },
	{ domain: "maybank2u.com.my", description: "Malaysia's largest bank, online." },
	{ domain: "airasia.com", description: "Now everyone can fly." },
	{ domain: "carousell.com.my", description: "Buy and sell new and preloved goods nearby." },
	{ domain: "lalamove.com", description: "On-demand delivery and logistics." },
	{ domain: "carsome.com", description: "Inspected used cars, bought and sold online." },
	{ domain: "iproperty.com.my", description: "Find homes, rentals, and new launches in Malaysia." },
	{ domain: "mudah.my", description: "Malaysia's largest classifieds marketplace." },
	{ domain: "jobstreet.com.my", description: "Jobs and hiring for the Malaysian market." },
	{ domain: "setel.com", description: "Pay for fuel and parking from your phone." },
	{ domain: "boost-my.com", description: "eWallet for everyday Malaysian payments." },
	{ domain: "cimbclicks.com.my", description: "Digital banking from CIMB." },
	{ domain: "pbebank.com", description: "Public Bank online banking." },
	{ domain: "hlb.com.my", description: "Hong Leong Bank digital services." },
	{ domain: "tnb.com.my", description: "Electricity for homes and businesses in Malaysia." },
	{ domain: "unifi.com.my", description: "Home fibre and mobile from Telekom Malaysia." },
	{ domain: "maxis.com.my", description: "Mobile, fibre, and 5G in Malaysia." },
	{ domain: "celcomdigi.com", description: "Malaysia's largest mobile network." },
	{ domain: "umobile.com.my", description: "Prepaid and postpaid mobile plans." },
	{ domain: "hotlink.com.my", description: "Prepaid reloads and plans from Maxis." },
	{ domain: "yes.my", description: "5G home and mobile internet." },
	{ domain: "astro.com.my", description: "TV, streaming, and sports for Malaysia." },
	{ domain: "sooka.my", description: "Live sports and entertainment streaming." },
	{ domain: "netflix.com", description: "Films, series, and more on demand." },
	{ domain: "spotify.com", description: "Music and podcasts for every mood." },
	{ domain: "youtube.com", description: "Watch, upload, and share video." },
	{ domain: "tiktok.com", description: "Short video that moves culture." },
	{ domain: "instagram.com", description: "Photos, stories, and Reels." },
	{ domain: "whatsapp.com", description: "Simple, reliable messaging." },
	{ domain: "telegram.org", description: "Cloud messaging for people and communities." },
	{ domain: "canva.com", description: "Design anything, for anyone." },
	{ domain: "midjourney.com", description: "Imagine images with AI." },
	{ domain: "loom.com", description: "Record and share video messages at work." },
	{ domain: "slack.com", description: "Where work happens." },
	{ domain: "zoom.us", description: "Video meetings for everyone." },
	{ domain: "google.com", description: "Search, maps, and the rest of the internet." },
	{ domain: "apple.com", description: "iPhone, Mac, and the rest of the lineup." },
	{ domain: "samsung.com", description: "Phones, TVs, and home appliances." },
	{ domain: "huawei.com", description: "Phones, laptops, and network tech." },
	{ domain: "xiaomi.com", description: "Phones and smart home at fair prices." },
	{ domain: "lazada.com", description: "Southeast Asian commerce, powered by Alibaba." },
	{ domain: "amazon.com", description: "Everything, delivered." },
	{ domain: "shopify.com", description: "Start and scale your store." },
	{ domain: "woocommerce.com", description: "Open-source ecommerce for WordPress." },
	{ domain: "webflow.com", description: "Design and ship production sites visually." },
	{ domain: "framer.com", description: "Design and publish sites that feel alive." },
	{ domain: "bubble.io", description: "Build apps without writing code." },
	{ domain: "airtable.com", description: "Spreadsheet-database hybrid for teams." },
	{ domain: "asana.com", description: "Work management for teams." },
	{ domain: "monday.com", description: "Work OS for projects and processes." },
	{ domain: "atlassian.com", description: "Jira, Confluence, and team software." },
	{ domain: "dropbox.com", description: "Cloud files for people and teams." },
	{ domain: "box.com", description: "Content management for the enterprise." },
	{ domain: "twilio.com", description: "APIs for SMS, voice, and WhatsApp." },
	{ domain: "cloudflare.com", description: "Security, performance, and serverless on the edge." },
	{ domain: "digitalocean.com", description: "Simple cloud for developers." },
	{ domain: "aws.amazon.com", description: "Cloud infrastructure at global scale." },
	{ domain: "railway.app", description: "Deploy apps without the ops overhead." },
	{ domain: "render.com", description: "Cloud for developers who want less YAML." },
	{ domain: "netlify.com", description: "Build, deploy, and scale web projects." },
	{ domain: "heroku.com", description: "Apps, from git push to running in the cloud." },
	{ domain: "posthog.com", description: "Product analytics you can self-host." },
	{ domain: "mixpanel.com", description: "Product analytics for user behavior." },
	{ domain: "amplitude.com", description: "Digital analytics for product teams." },
	{ domain: "intercom.com", description: "Customer messaging and support." },
	{ domain: "zendesk.com", description: "Customer service software." },
	{ domain: "hubspot.com", description: "CRM, marketing, and sales in one platform." },
	{ domain: "salesforce.com", description: "Customer 360 CRM." },
	{ domain: "mailchimp.com", description: "Email marketing and automations." },
	{ domain: "beehiiv.com", description: "Newsletter platform for writers and media." },
	{ domain: "substack.com", description: "Publish newsletters and grow a following." },
	{ domain: "medium.com", description: "A place to read, write, and go deeper." },
	{ domain: "producthunt.com", description: "The place to launch and discover new products." },
	{ domain: "ycombinator.com", description: "The startup accelerator behind thousands of companies." },
	{ domain: "techinasia.com", description: "News and jobs for Asia's tech scene." },
	{ domain: "theedgemalaysia.com", description: "Business and investment news for Malaysia." },
	{ domain: "malaymail.com", description: "Malaysian news, in English and Malay." },
	{ domain: "nst.com.my", description: "New Straits Times news." },
	{ domain: "thestar.com.my", description: "Malaysia's most-read English daily." },
	{ domain: "bharian.com.my", description: "Berita Harian, berita dalam BM." },
	{ domain: "utusan.com.my", description: "Berita dan isu semasa Malaysia." },
	{ domain: "klook.com", description: "Tours, attractions, and travel deals." },
	{ domain: "booking.com", description: "Hotels, homes, and stays worldwide." },
	{ domain: "agoda.com", description: "Hotels and homes across Asia and beyond." },
	{ domain: "tripadvisor.com", description: "Reviews for hotels, restaurants, and experiences." },
	{ domain: "grabpay.com", description: "Pay in-store and online with Grab." },
];

if (DEMO_SEEDS.length !== 100) {
	throw new Error(`Expected 100 demo seeds, got ${DEMO_SEEDS.length}`);
}

export const DEMO_PRODUCTS: Product[] = DEMO_SEEDS.map((seed, index) => {
	const rank = index + 1;
	return {
		id: `demo-${rank}`,
		domain: seed.domain,
		url: `https://${seed.domain}`,
		faviconUrl: faviconFor(seed.domain),
		description: seed.description,
		clickCount: Math.max(18, Math.round(8800 / Math.sqrt(rank) + ((rank * 53) % 220))),
		totalPaidSen: (101 - rank) * 12880,
		rank,
	};
});

export type TrendingSite = {
	domain: string;
	url: string;
	faviconUrl: string;
	clicksPerHour: number;
};

export type LatestPayment = {
	domain: string;
	url: string;
	faviconUrl: string;
	amountSen: number;
	rank: number | null;
};

export const DEMO_TRENDING: TrendingSite[] = DEMO_PRODUCTS.slice()
	.sort((a, b) => b.clickCount - a.clickCount)
	.slice(0, 6)
	.map((product, index) => ({
		domain: product.domain,
		url: product.url,
		faviconUrl: product.faviconUrl,
		clicksPerHour: Math.max(2, Math.round(48 - index * 7)),
	}));

export const DEMO_LATEST: LatestPayment[] = [7, 12, 3, 18, 5, 24].map((rank, index) => {
	const product = DEMO_PRODUCTS[rank - 1];
	return {
		domain: product.domain,
		url: product.url,
		faviconUrl: product.faviconUrl,
		amountSen: 200 + index * 150,
		rank: product.rank,
	};
});


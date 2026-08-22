import { useEffect, useMemo, useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { useLocale } from "@/i18n/locale-provider";
import type { AnalyticsRange, CloudflareAnalytics } from "../../worker/cloudflare-analytics";

const CHART_RED = "#e84531";
const CHART_YELLOW = "#ffd400";
const CHART_INK = "#211b17";
const CHART_MUTED = "#8a8178";

function formatBytes(bytes: number, locale: string) {
	const units = ["B", "KB", "MB", "GB", "TB"];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit += 1;
	}
	return `${new Intl.NumberFormat(locale, { maximumFractionDigits: value >= 10 ? 0 : 1 }).format(value)} ${units[unit]}`;
}

function formatPercent(value: number, locale: string) {
	return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(value);
}

export function StatsDashboard() {
	const { t, number, intlLocale } = useLocale();
	const [range, setRange] = useState<AnalyticsRange>("24h");
	const [data, setData] = useState<CloudflareAnalytics | null>(null);
	const [status, setStatus] = useState<"loading" | "ready" | "error" | "unavailable">("loading");

	useEffect(() => {
		const controller = new AbortController();
		setStatus("loading");
		void fetch(`/api/cloudflare-analytics?range=${range}`, { signal: controller.signal })
			.then(async (response) => {
				if (response.status === 503) {
					setStatus("unavailable");
					setData(null);
					return;
				}
				if (!response.ok) throw new Error("Unable to load analytics");
				const payload = (await response.json()) as CloudflareAnalytics;
				setData(payload);
				setStatus("ready");
			})
			.catch((error: unknown) => {
				if (error instanceof DOMException && error.name === "AbortError") return;
				setStatus("error");
				setData(null);
			});
		return () => controller.abort();
	}, [range]);

	const countryNames = useMemo(
		() => new Intl.DisplayNames(intlLocale, { type: "region" }),
		[intlLocale],
	);

	const timeseries = useMemo(() => {
		if (!data) return [];
		const axisFormat = new Intl.DateTimeFormat(
			intlLocale,
			range === "7d"
				? { month: "short", day: "numeric", hour: "2-digit" }
				: { hour: "2-digit", minute: "2-digit" },
		);
		const tooltipFormat = new Intl.DateTimeFormat(intlLocale, {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
		return data.timeseries.map((point) => ({
			...point,
			label: axisFormat.format(new Date(point.time)),
			tooltipLabel: tooltipFormat.format(new Date(point.time)),
		}));
	}, [data, intlLocale, range]);

	const countries = useMemo(
		() =>
			(data?.countries ?? []).map((row) => ({
				...row,
				label: countryNames.of(row.name) ?? row.name,
			})),
		[countryNames, data],
	);

	if (status === "unavailable") {
		return (
			<section className="stats-empty">
				<h2>{t("statsEmptyTitle")}</h2>
				<p>{t("statsEmptyBody")}</p>
			</section>
		);
	}

	if (status === "error") {
		return (
			<section className="stats-empty">
				<h2>{t("statsLoadError")}</h2>
			</section>
		);
	}

	return (
		<div className="stats-dashboard">
			<div className="stats-range" role="group" aria-label={t("statsRangeLabel")}>
				{(["24h", "7d"] as const).map((option) => (
					<button
						key={option}
						type="button"
						className={option === range ? "is-active" : undefined}
						onClick={() => setRange(option)}
					>
						{option === "24h" ? t("statsRange24h") : t("statsRange7d")}
					</button>
				))}
			</div>

			<div className="stats-kpis">
				<Kpi label={t("statsRequests")} value={status === "ready" && data ? number.format(data.totals.requests) : "—"} />
				<Kpi label={t("statsVisits")} value={status === "ready" && data ? number.format(data.totals.visits) : "—"} />
				<Kpi
					label={t("statsBandwidth")}
					value={status === "ready" && data ? formatBytes(data.totals.bytes, intlLocale) : "—"}
				/>
				<Kpi
					label={t("statsErrorRate")}
					value={status === "ready" && data ? formatPercent(data.totals.errorRate, intlLocale) : "—"}
				/>
			</div>

			<div className="stats-grid">
				<TimeSeriesPanel
					title={t("statsRequests")}
					data={timeseries}
					dataKey="requests"
					color={CHART_RED}
					fillOpacity={0.16}
					formatValue={(value) => number.format(value)}
					seriesLabel={t("statsRequestsSeries")}
				/>
				<TimeSeriesPanel
					title={t("statsVisits")}
					data={timeseries}
					dataKey="visits"
					color={CHART_YELLOW}
					fillOpacity={0.28}
					formatValue={(value) => number.format(value)}
					seriesLabel={t("statsVisitsSeries")}
				/>
			</div>

			<div className="stats-grid">
				<section className="stats-panel">
					<h2>{t("statsCountriesTitle")}</h2>
					<div className="stats-chart">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={countries} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
								<CartesianGrid stroke="#efe8df" horizontal={false} />
								<XAxis type="number" tick={{ fill: CHART_MUTED, fontSize: 11 }} tickLine={false} axisLine={false} />
								<YAxis type="category" dataKey="label" width={88} tick={{ fill: CHART_INK, fontSize: 11 }} tickLine={false} axisLine={false} />
								<Tooltip
									formatter={(value, key) => [
										number.format(Number(value ?? 0)),
										key === "visits" ? t("statsVisitsSeries") : t("statsRequestsSeries"),
									]}
								/>
								<Legend
									formatter={(value) =>
										value === "visits" ? t("statsVisitsSeries") : t("statsRequestsSeries")
									}
								/>
								<Bar dataKey="requests" fill={CHART_RED} radius={[0, 6, 6, 0]} />
								<Bar dataKey="visits" fill={CHART_YELLOW} radius={[0, 6, 6, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</section>

				<section className="stats-panel">
					<h2>{t("statsPathsTitle")}</h2>
					<div className="stats-chart">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={data?.paths ?? []} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
								<CartesianGrid stroke="#efe8df" horizontal={false} />
								<XAxis type="number" tick={{ fill: CHART_MUTED, fontSize: 11 }} tickLine={false} axisLine={false} />
								<YAxis type="category" dataKey="name" width={110} tick={{ fill: CHART_INK, fontSize: 11 }} tickLine={false} axisLine={false} />
								<Tooltip formatter={(value) => number.format(Number(value ?? 0))} />
								<Bar dataKey="requests" fill={CHART_INK} radius={[0, 6, 6, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</section>
			</div>
		</div>
	);
}

function TimeSeriesPanel({
	title,
	data,
	dataKey,
	color,
	fillOpacity,
	formatValue,
	seriesLabel,
}: {
	title: string;
	data: Array<Record<string, string | number>>;
	dataKey: "requests" | "visits";
	color: string;
	fillOpacity: number;
	formatValue: (value: number) => string;
	seriesLabel: string;
}) {
	return (
		<section className="stats-panel">
			<h2>{title}</h2>
			<div className="stats-chart stats-chart--tall">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
						<CartesianGrid stroke="#efe8df" vertical={false} />
						<XAxis dataKey="label" tick={{ fill: CHART_MUTED, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
						<YAxis tick={{ fill: CHART_MUTED, fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
						<Tooltip
							contentStyle={{ borderRadius: 10, border: "1px solid #ded5ca" }}
							labelFormatter={(_label, payload) =>
								String(payload?.[0]?.payload?.tooltipLabel ?? payload?.[0]?.payload?.label ?? "")
							}
							formatter={(value) => [formatValue(Number(value ?? 0)), seriesLabel]}
						/>
						<Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={fillOpacity} strokeWidth={2} />
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</section>
	);
}

function Kpi({ label, value }: { label: string; value: string }) {
	return (
		<div className="stats-kpi">
			<p>{label}</p>
			<strong>{value}</strong>
		</div>
	);
}

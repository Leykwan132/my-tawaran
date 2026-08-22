const GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";

export type AnalyticsRange = "24h" | "7d";

export type AnalyticsPoint = {
	time: string;
	requests: number;
	visits: number;
	bytes: number;
};

export type NamedCount = {
	name: string;
	requests: number;
};

export type CountryCount = NamedCount & {
	visits: number;
};

export type CloudflareAnalytics = {
	range: AnalyticsRange;
	start: string;
	end: string;
	totals: {
		requests: number;
		visits: number;
		bytes: number;
		errorRate: number;
	};
	timeseries: AnalyticsPoint[];
	countries: CountryCount[];
	paths: NamedCount[];
};

type GraphQLGroup = {
	count?: number;
	dimensions?: {
		datetimeHour?: string | null;
		datetimeFiveMinutes?: string | null;
		clientCountryName?: string | null;
		clientRequestPath?: string | null;
	};
	sum?: {
		edgeResponseBytes?: number | null;
		visits?: number | null;
	};
	ratio?: {
		status4xx?: number | null;
		status5xx?: number | null;
	};
};

type ZoneNode = {
	timeseries?: GraphQLGroup[];
	countries?: GraphQLGroup[];
	paths?: GraphQLGroup[];
};

type GraphQLPayload = {
	data?: {
		viewer?: {
			zones?: ZoneNode[];
		};
	};
	errors?: Array<{ message?: string }>;
};

const DASHBOARD_QUERY = `
query ZoneDashboard($zoneTag: string!, $start: Time!, $end: Time!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      timeseries: httpRequestsAdaptiveGroups(
        filter: { datetime_geq: $start, datetime_leq: $end, requestSource: "eyeball" }
        limit: 500
        orderBy: [datetimeHour_ASC]
      ) {
        count
        dimensions { datetimeHour }
        sum { edgeResponseBytes visits }
        ratio { status4xx status5xx }
      }
      countries: httpRequestsAdaptiveGroups(
        filter: { datetime_geq: $start, datetime_leq: $end, requestSource: "eyeball" }
        limit: 8
        orderBy: [count_DESC]
      ) {
        count
        sum { visits }
        dimensions { clientCountryName }
      }
      paths: httpRequestsAdaptiveGroups(
        filter: {
          datetime_geq: $start
          datetime_leq: $end
          requestSource: "eyeball"
          AND: [
            { clientRequestPath_notlike: "/assets/%" }
            { clientRequestPath_notlike: "/cdn-cgi/%" }
          ]
        }
        limit: 8
        orderBy: [count_DESC]
      ) {
        count
        dimensions { clientRequestPath }
      }
    }
  }
}
`;

const FINE_TIMESERIES_QUERY = `
query ZoneHourly($zoneTag: string!, $start: Time!, $end: Time!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      timeseries: httpRequestsAdaptiveGroups(
        filter: { datetime_geq: $start, datetime_leq: $end, requestSource: "eyeball" }
        limit: 300
        orderBy: [datetimeFiveMinutes_ASC]
      ) {
        count
        dimensions { datetimeFiveMinutes }
        sum { edgeResponseBytes visits }
        ratio { status4xx status5xx }
      }
      countries: httpRequestsAdaptiveGroups(
        filter: { datetime_geq: $start, datetime_leq: $end, requestSource: "eyeball" }
        limit: 8
        orderBy: [count_DESC]
      ) {
        count
        sum { visits }
        dimensions { clientCountryName }
      }
      paths: httpRequestsAdaptiveGroups(
        filter: {
          datetime_geq: $start
          datetime_leq: $end
          requestSource: "eyeball"
          AND: [
            { clientRequestPath_notlike: "/assets/%" }
            { clientRequestPath_notlike: "/cdn-cgi/%" }
          ]
        }
        limit: 8
        orderBy: [count_DESC]
      ) {
        count
        dimensions { clientRequestPath }
      }
    }
  }
}
`;

export function parseAnalyticsRange(value: string | undefined): AnalyticsRange {
	return value === "7d" ? "7d" : "24h";
}

// httpRequestsAdaptiveGroups allows a 24h query window on Free (7d on Pro).
const ADAPTIVE_QUERY_WINDOW_MS = 24 * 60 * 60 * 1000;

function rangeWindow(range: AnalyticsRange, now = Date.now()) {
	const end = new Date(now);
	const hours = range === "7d" ? 7 * 24 : 24;
	const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
	return { start: start.toISOString(), end: end.toISOString() };
}

function queryWindows(startIso: string, endIso: string) {
	const start = new Date(startIso).getTime();
	const end = new Date(endIso).getTime();
	const windows: Array<{ start: string; end: string }> = [];
	for (let cursor = start; cursor < end; cursor += ADAPTIVE_QUERY_WINDOW_MS) {
		windows.push({
			start: new Date(cursor).toISOString(),
			end: new Date(Math.min(cursor + ADAPTIVE_QUERY_WINDOW_MS, end)).toISOString(),
		});
	}
	return windows;
}

async function queryGraphQL(token: string, query: string, variables: Record<string, string>) {
	const response = await fetch(GRAPHQL_ENDPOINT, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ query, variables }),
	});
	const payload = (await response.json()) as GraphQLPayload;
	if (!response.ok) {
		throw new Error(`Cloudflare GraphQL HTTP ${response.status}`);
	}
	if (payload.errors?.length) {
		throw new Error(payload.errors.map((error) => error.message || "GraphQL error").join("; "));
	}
	return payload;
}

function num(value: number | null | undefined) {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function fillSeries(
	rows: GraphQLGroup[],
	startIso: string,
	endIso: string,
	stepMs: number,
	timeKey: "datetimeHour" | "datetimeFiveMinutes",
): AnalyticsPoint[] {
	const byTime = new Map<string, AnalyticsPoint>();
	for (const row of rows) {
		const time = row.dimensions?.[timeKey];
		if (!time) continue;
		byTime.set(time, {
			time,
			requests: num(row.count),
			visits: num(row.sum?.visits),
			bytes: num(row.sum?.edgeResponseBytes),
		});
	}

	const points: AnalyticsPoint[] = [];
	const start = new Date(startIso).getTime();
	const end = new Date(endIso).getTime();
	for (let ts = start - (start % stepMs); ts <= end; ts += stepMs) {
		const time = new Date(ts).toISOString().replace(/\.\d{3}Z$/, "Z");
		points.push(byTime.get(time) ?? { time, requests: 0, visits: 0, bytes: 0 });
	}
	return points;
}

function mergeZones(zones: ZoneNode[]): ZoneNode {
	return {
		timeseries: zones.flatMap((zone) => zone.timeseries ?? []),
		countries: zones.flatMap((zone) => zone.countries ?? []),
		paths: zones.flatMap((zone) => zone.paths ?? []),
	};
}

function topNamed(
	rows: GraphQLGroup[],
	dimension: "clientCountryName" | "clientRequestPath",
	limit = 8,
): NamedCount[] {
	const totals = new Map<string, number>();
	for (const row of rows) {
		const name = row.dimensions?.[dimension];
		if (!name) continue;
		totals.set(name, (totals.get(name) ?? 0) + num(row.count));
	}
	return [...totals.entries()]
		.sort((left, right) => right[1] - left[1])
		.slice(0, limit)
		.map(([name, requests]) => ({ name, requests }));
}

function topCountries(rows: GraphQLGroup[], limit = 8): CountryCount[] {
	const totals = new Map<string, { requests: number; visits: number }>();
	for (const row of rows) {
		const name = row.dimensions?.clientCountryName;
		if (!name) continue;
		const current = totals.get(name) ?? { requests: 0, visits: 0 };
		current.requests += num(row.count);
		current.visits += num(row.sum?.visits);
		totals.set(name, current);
	}
	return [...totals.entries()]
		.sort((left, right) => right[1].requests - left[1].requests)
		.slice(0, limit)
		.map(([name, totals]) => ({ name, ...totals }));
}

function mapDashboard(range: AnalyticsRange, start: string, end: string, zone: ZoneNode): CloudflareAnalytics {
	const timeKey = range === "24h" ? "datetimeFiveMinutes" : "datetimeHour";
	const stepMs = range === "24h" ? 5 * 60 * 1000 : 60 * 60 * 1000;
	const liveRows = zone.timeseries ?? [];
	const timeseries = fillSeries(liveRows, start, end, stepMs, timeKey);
	const requests = timeseries.reduce((sum, point) => sum + point.requests, 0);
	const visits = timeseries.reduce((sum, point) => sum + point.visits, 0);
	const bytes = timeseries.reduce((sum, point) => sum + point.bytes, 0);
	const errorRate =
		requests > 0
			? liveRows.reduce(
					(sum, row) => sum + num(row.count) * (num(row.ratio?.status4xx) + num(row.ratio?.status5xx)),
					0,
				) / requests
			: 0;

	return {
		range,
		start,
		end,
		totals: {
			requests,
			visits,
			bytes,
			errorRate,
		},
		timeseries,
		countries: topCountries(zone.countries ?? []),
		paths: topNamed(zone.paths ?? [], "clientRequestPath"),
	};
}

export async function fetchCloudflareAnalytics(
	token: string,
	zoneTag: string,
	range: AnalyticsRange,
): Promise<CloudflareAnalytics> {
	const { start, end } = rangeWindow(range);
	const query = range === "24h" ? FINE_TIMESERIES_QUERY : DASHBOARD_QUERY;
	const zones = await Promise.all(
		queryWindows(start, end).map(async (window) => {
			const payload = await queryGraphQL(token, query, {
				zoneTag,
				start: window.start,
				end: window.end,
			});
			const zone = payload.data?.viewer?.zones?.[0];
			if (!zone) throw new Error("No analytics returned for this zone");
			return zone;
		}),
	);
	return mapDashboard(range, start, end, mergeZones(zones));
}

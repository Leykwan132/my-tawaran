import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCloudflareAnalytics } from "./cloudflare-analytics";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("fetchCloudflareAnalytics", () => {
	it("returns visits alongside requests for each country", async () => {
		vi.stubGlobal("fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
			const request = JSON.parse(String(init?.body)) as { query: string };
			const countryQuery = request.query.match(/countries: httpRequestsAdaptiveGroups\([\s\S]*?\n      }/);
			const requestedVisits = countryQuery?.[0].includes("sum { visits }") ?? false;

			return Response.json({
				data: {
					viewer: {
						zones: [
							{
								timeseries: [],
								countries: [
									{
										count: 40,
										dimensions: { clientCountryName: "Malaysia" },
										sum: requestedVisits ? { visits: 18 } : {},
									},
								],
								paths: [],
							},
						],
					},
				},
			});
		});

		const analytics = await fetchCloudflareAnalytics("token", "zone", "24h");

		expect(analytics.countries).toEqual([
			{ name: "Malaysia", requests: 40, visits: 18 },
		]);
	});
});

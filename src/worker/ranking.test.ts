import { describe, expect, it } from "vitest";
import {
	calculateContributionDue,
	buildCheckoutCopy,
	projectRank,
	calculateListingTopUpSen,
	minimumTotalForRank,
	rankProducts,
} from "./ranking";

describe("calculateContributionDue", () => {
	it("charges only the increase over a listing's prior successful total", () => {
		expect(calculateContributionDue(500, 2_000)).toBe(1_500);
	});

	it("rejects a target that does not increase the listing total", () => {
		expect(() => calculateContributionDue(2_000, 2_000)).toThrow(
			"Target must be higher than this listing's current total",
		);
	});
});

describe("rankProducts", () => {
	it("sorts products by paid total, then by webhook settlement order", () => {
		const ranked = rankProducts([
			{ id: "later", totalPaidSen: 2_000, settlementSequence: 12 },
			{ id: "higher", totalPaidSen: 2_100, settlementSequence: 99 },
			{ id: "first", totalPaidSen: 2_000, settlementSequence: 11 },
		]);

		expect(ranked.map((product) => product.id)).toEqual([
			"higher",
			"first",
			"later",
		]);
	});
});

describe("projectRank", () => {
	it("returns the placement for a target contribution total", () => {
		const totals = [1_288_000, 964_000, 725_000, 540_000];
		expect(projectRank(1_300_000, totals)).toBe(1);
		expect(projectRank(1_288_000, totals)).toBe(1);
		expect(projectRank(970_000, totals)).toBe(2);
		expect(projectRank(100, totals)).toBe(5);
	});
});

describe("calculateListingTopUpSen", () => {
	it("returns the full target for a new listing", () => {
		expect(calculateListingTopUpSen(2_000, null)).toBe(2_000);
	});

	it("returns only the increase needed for an existing listing", () => {
		expect(calculateListingTopUpSen(2_000, 1_500)).toBe(500);
	});

	it("never returns a negative top-up", () => {
		expect(calculateListingTopUpSen(1_500, 2_000)).toBe(0);
	});
});

describe("minimumTotalForRank", () => {
	it("returns the leader total needed for rank 1", () => {
		expect(minimumTotalForRank(1, [1_288_000, 964_000])).toBe(1_288_000);
	});

	it("returns the matching total needed for an intermediate rank", () => {
		expect(minimumTotalForRank(2, [1_288_000, 964_000, 725_000])).toBe(964_000);
	});

	it("defaults the floor to RM2", () => {
		expect(minimumTotalForRank(9, [])).toBe(200);
	});

	it("returns the minimum bid when only lower ranks are available", () => {
		expect(minimumTotalForRank(2, [1_288_000], { minimumSen: 200 })).toBe(200);
	});

	it("ignores the current listing when calculating a new target", () => {
		expect(
			minimumTotalForRank(1, [1_288_000], {
				excludeTotalSen: 1_288_000,
				minimumSen: 200,
			}),
		).toBe(200);
	});
});

describe("buildCheckoutCopy", () => {
	it("describes the projected MyTawaran placement and amount due", () => {
		expect(
			buildCheckoutCopy({
				projectedRank: 12,
				domain: "example.com",
				amountDueSen: 2_000,
			}),
		).toEqual({
			name: "#12 MyTawaran - example.com",
			description:
				"Claim the #12 spot for MyTawaran for example.com with RM20.00.",
		});
	});
});

import { describe, expect, it } from "vitest";
import { appendLeaderboardPage } from "./leaderboard-pages";

describe("appendLeaderboardPage", () => {
	it("appends the next batch without duplicating products already loaded", () => {
		expect(
			appendLeaderboardPage(
				[{ id: "one" }, { id: "two" }],
				[{ id: "two" }, { id: "three" }],
			),
		).toEqual([{ id: "one" }, { id: "two" }, { id: "three" }]);
	});
});

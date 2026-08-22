import { describe, expect, it } from "vitest";
import { interpolate } from "./translations";

describe("interpolate", () => {
	it("replaces placeholders with the matching variables", () => {
		expect(interpolate("Claim #{rank} for {amount}.", { rank: 3, amount: "RM5" })).toBe(
			"Claim #3 for RM5.",
		);
	});

	it("returns a non-string template untouched instead of throwing", () => {
		expect(interpolate(undefined as unknown as string, { rank: 1 })).toBeUndefined();
	});
});

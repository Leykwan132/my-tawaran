import { describe, expect, it } from "vitest";
import { isTerminalCheckoutFailure, verifyStripeSignature } from "./stripe";

async function signatureFor(payload: string, timestamp: number, secret: string) {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(`${timestamp}.${payload}`),
	);
	return Array.from(new Uint8Array(signature), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
}

describe("verifyStripeSignature", () => {
	it("accepts Stripe's signed raw payload", async () => {
		const payload = '{"id":"evt_123"}';
		const timestamp = Math.floor(Date.now() / 1000);
		const secret = "whsec_test";
		const signature = await signatureFor(payload, timestamp, secret);

		await expect(
			verifyStripeSignature(
				payload,
				`t=${timestamp},v1=${signature}`,
				secret,
			),
		).resolves.toBe(true);
	});

	it("rejects a payload signed with a different secret", async () => {
		const payload = '{"id":"evt_123"}';
		const timestamp = Math.floor(Date.now() / 1000);
		const signature = await signatureFor(payload, timestamp, "whsec_other");

		await expect(
			verifyStripeSignature(
				payload,
				`t=${timestamp},v1=${signature}`,
				"whsec_test",
			),
		).resolves.toBe(false);
	});
});

describe("isTerminalCheckoutFailure", () => {
	it("releases a pending contribution after Stripe reports an asynchronous payment failure", () => {
		expect(isTerminalCheckoutFailure("checkout.session.async_payment_failed")).toBe(true);
	});
});

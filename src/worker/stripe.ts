const encoder = new TextEncoder();

function hex(bytes: ArrayBuffer): string {
	return Array.from(new Uint8Array(bytes), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
}

function fixedTimeEquals(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let index = 0; index < a.length; index += 1) {
		mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
	}
	return mismatch === 0;
}

export async function verifyStripeSignature(
	rawBody: string,
	signatureHeader: string | null,
	endpointSecret: string,
): Promise<boolean> {
	if (!signatureHeader || !endpointSecret) return false;

	const parts = signatureHeader.split(",");
	const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
	const signatures = parts
		.filter((part) => part.startsWith("v1="))
		.map((part) => part.slice(3));
	if (!timestamp || signatures.length === 0) return false;

	const timestampNumber = Number(timestamp);
	if (
		!Number.isInteger(timestampNumber) ||
		Math.abs(Date.now() / 1000 - timestampNumber) > 300
	) {
		return false;
	}

	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(endpointSecret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const expected = hex(
		await crypto.subtle.sign(
			"HMAC",
			key,
			encoder.encode(`${timestamp}.${rawBody}`),
		),
	);

	return signatures.some((signature) => fixedTimeEquals(expected, signature));
}

export function isTerminalCheckoutFailure(eventType: string): boolean {
	return (
		eventType === "checkout.session.expired" ||
		eventType === "checkout.session.async_payment_failed"
	);
}

export type RankedProduct = {
	id: string;
	totalPaidSen: number;
	settlementSequence: number;
};

export function calculateContributionDue(
	priorSuccessfulTotalSen: number,
	targetContributionSen: number,
): number {
	const amountDueSen = targetContributionSen - priorSuccessfulTotalSen;
	if (amountDueSen <= 0) {
		throw new Error("Target must be higher than this listing's current total");
	}
	return amountDueSen;
}

export function rankProducts<T extends RankedProduct>(products: T[]): T[] {
	return [...products].sort(
		(a, b) =>
			b.totalPaidSen - a.totalPaidSen ||
			a.settlementSequence - b.settlementSequence,
	);
}

export function projectRank(
	targetContributionSen: number,
	productTotals: number[],
): number {
	return productTotals.filter((total) => total > targetContributionSen).length + 1;
}

export function calculateListingTopUpSen(
	targetTotalSen: number,
	existingListingTotalSen: number | null,
): number {
	if (existingListingTotalSen == null) return targetTotalSen;
	return Math.max(0, targetTotalSen - existingListingTotalSen);
}

export function minimumTotalForRank(
	targetRank: number,
	productTotals: number[],
	options: { excludeTotalSen?: number | null; minimumSen?: number } = {},
): number {
	const minimumSen = options.minimumSen ?? 100;
	const normalizedRank = Math.max(1, Math.floor(targetRank) || 1);
	const totals = [...productTotals];

	if (options.excludeTotalSen != null) {
		const excludeIndex = totals.indexOf(options.excludeTotalSen);
		if (excludeIndex >= 0) totals.splice(excludeIndex, 1);
	}

	totals.sort((left, right) => right - left);

	if (totals.length === 0) return minimumSen;
	if (normalizedRank === 1) return Math.max(minimumSen, totals[0]);
	if (normalizedRank <= totals.length) {
		return Math.max(minimumSen, totals[normalizedRank - 1]);
	}

	return minimumSen;
}

export function buildCheckoutCopy({
	projectedRank,
	domain,
	amountDueSen,
}: {
	projectedRank: number;
	domain: string;
	amountDueSen: number;
}): { name: string; description: string } {
	const amount = `RM${(amountDueSen / 100).toFixed(2)}`;
	return {
		name: `#${projectedRank} MyTawaran - ${domain}`,
		description: `Claim the #${projectedRank} spot for MyTawaran for ${domain} with ${amount}.`,
	};
}

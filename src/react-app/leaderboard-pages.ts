export function appendLeaderboardPage<T extends { id: string }>(current: T[], nextPage: T[]): T[] {
	const loadedIds = new Set(current.map((item) => item.id));
	return [...current, ...nextPage.filter((item) => !loadedIds.has(item.id))];
}

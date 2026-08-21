import { type MouseEvent } from "react";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { useLocale } from "@/i18n/locale-provider";

function getPaginationItems(page: number, totalPages: number) {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, index) => index);
	}

	const pages = new Set<number>([0, totalPages - 1, page]);
	if (page > 0) pages.add(page - 1);
	if (page < totalPages - 1) pages.add(page + 1);

	const sorted = [...pages].sort((left, right) => left - right);
	const items: Array<number | "ellipsis"> = [];

	for (let index = 0; index < sorted.length; index += 1) {
		if (index > 0 && sorted[index] - sorted[index - 1] > 1) {
			items.push("ellipsis");
		}
		items.push(sorted[index]);
	}

	return items;
}

type LeaderboardPaginationProps = {
	page: number;
	total: number;
	pageSize: number;
	onPageChange: (page: number) => void;
};

export function LeaderboardPagination({ page, total, pageSize, onPageChange }: LeaderboardPaginationProps) {
	const { t, intlLocale } = useLocale();
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	if (totalPages <= 1) return null;

	const rangeStart = total === 0 ? 0 : page * pageSize + 1;
	const rangeEnd = Math.min((page + 1) * pageSize, total);
	const items = getPaginationItems(page, totalPages);
	const formatCount = (value: number) => value.toLocaleString(intlLocale);

	const goToPage = (nextPage: number) => (event: MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault();
		if (nextPage === page) return;
		onPageChange(nextPage);
	};

	return (
		<div className="leaderboard-pagination">
			<Pagination aria-label={t("paginationAria")}>
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious
							href="#"
							text={t("paginationPrevious")}
							aria-label={t("paginationPrevAria")}
							onClick={goToPage(Math.max(0, page - 1))}
							className={page === 0 ? "pointer-events-none opacity-50" : undefined}
						/>
					</PaginationItem>

					{items.map((item, index) =>
						item === "ellipsis" ? (
							<PaginationItem key={`ellipsis-${index}`}>
								<PaginationEllipsis text={t("paginationMore")} />
							</PaginationItem>
						) : (
							<PaginationItem key={item}>
								<PaginationLink href="#" isActive={item === page} onClick={goToPage(item)}>
									{item + 1}
								</PaginationLink>
							</PaginationItem>
						),
					)}

					<PaginationItem>
						<PaginationNext
							href="#"
							text={t("paginationNext")}
							aria-label={t("paginationNextAria")}
							onClick={goToPage(Math.min(totalPages - 1, page + 1))}
							className={page >= totalPages - 1 ? "pointer-events-none opacity-50" : undefined}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
			<p className="leaderboard-pagination-summary">
				{t("paginationSummary", {
					start: formatCount(rangeStart),
					end: formatCount(rangeEnd),
					total: formatCount(total),
				})}
			</p>
		</div>
	);
}

import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES, type Locale } from "@/i18n/translations";
import { useLocale } from "@/i18n/locale-provider";

export function LanguageSwitch() {
	const { locale, setLocale, t } = useLocale();
	const current = LOCALES.find((option) => option.id === locale) ?? LOCALES[1];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button type="button" variant="outline" size="sm" className="lang-switch-trigger" aria-label={t("language")}>
						{current.label}
						<ChevronDownIcon data-icon="inline-end" />
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="lang-switch-menu">
				<DropdownMenuRadioGroup value={locale} onValueChange={(value) => setLocale(value as Locale)}>
					{LOCALES.map((option) => (
						<DropdownMenuRadioItem key={option.id} value={option.id}>
							{option.label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

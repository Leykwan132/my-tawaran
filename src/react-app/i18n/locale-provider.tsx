import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
	DEFAULT_LOCALE,
	INTL_LOCALE,
	LOCALES,
	LOCALE_STORAGE_KEY,
	interpolate,
	isLocale,
	translations,
	type Locale,
} from "./translations";

type MessageKey = Exclude<keyof (typeof translations)[Locale], "aboutRules">;

type LocaleContextValue = {
	locale: Locale;
	setLocale: (locale: Locale) => void;
	t: (key: MessageKey, vars?: Record<string, string | number>) => string;
	aboutRules: (typeof translations)[Locale]["aboutRules"];
	intlLocale: string;
	currency: Intl.NumberFormat;
	number: Intl.NumberFormat;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function detectLocale(): Locale {
	if (typeof window === "undefined") return DEFAULT_LOCALE;
	const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
	if (isLocale(stored)) return stored;

	const language = window.navigator.language.toLowerCase();
	if (language.startsWith("zh")) return "zh";
	if (language.startsWith("ms")) return "ms";
	return DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>(detectLocale);

	const setLocale = useCallback((next: Locale) => {
		setLocaleState(next);
		window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
	}, []);

	useEffect(() => {
		const meta = LOCALES.find((entry) => entry.id === locale);
		document.documentElement.lang = meta?.htmlLang ?? "en";
		document.title = translations[locale].documentTitle;
	}, [locale]);

	const value = useMemo<LocaleContextValue>(() => {
		const messages = translations[locale];
		const intlLocale = INTL_LOCALE[locale];
		return {
			locale,
			setLocale,
			aboutRules: messages.aboutRules,
			intlLocale,
			currency: new Intl.NumberFormat(intlLocale, {
				style: "currency",
				currency: "MYR",
				minimumFractionDigits: 0,
				maximumFractionDigits: 2,
			}),
			number: new Intl.NumberFormat(intlLocale),
			t: (key, vars) => {
				const template = messages[key];
				return vars ? interpolate(template, vars) : template;
			},
		};
	}, [locale, setLocale]);

	return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
	const context = useContext(LocaleContext);
	if (!context) throw new Error("useLocale must be used within LocaleProvider");
	return context;
}

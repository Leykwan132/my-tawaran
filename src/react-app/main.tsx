import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import posthog from "posthog-js";
import { LocaleProvider } from "@/i18n/locale-provider";
import "./index.css";
import App from "./App.tsx";

const phKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
const phHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined;

if (phKey && phHost) {
	posthog.init(phKey, {
		api_host: phHost,
		defaults: "2026-05-30",
	});
} else if (import.meta.env.DEV) {
	console.error(
		"VITE_PUBLIC_POSTHOG_KEY and VITE_PUBLIC_POSTHOG_HOST variables required by PostHog are missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_PUBLIC_POSTHOG_KEY and VITE_PUBLIC_POSTHOG_HOST are configured",
	);
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<LocaleProvider>
			<App />
		</LocaleProvider>
	</StrictMode>,
);

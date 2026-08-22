import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useLocale } from "@/i18n/locale-provider";
import logo from "@/assets/mytawaran-hibiscus.png";

export function AboutMytawaranDialog({ variant = "hero" }: { variant?: "hero" | "nav" }) {
	const { t, aboutRules } = useLocale();

	return (
		<Dialog>
			<DialogTrigger
				render={
					variant === "nav" ? (
						<button type="button" className="site-nav-about">
							{t("aboutTrigger")}
						</button>
					) : (
						<Button type="button" variant="outline" className="about-mytawaran-trigger">
							<img className="about-mytawaran-trigger-icon" src={logo} alt="" />
							{t("aboutTrigger")}
						</Button>
					)
				}
			/>
			<DialogContent className="about-mytawaran-dialog sm:max-w-md">
				<DialogHeader className="about-mytawaran-header">
					<img className="about-mytawaran-logo" src={logo} alt="" />
					<div className="about-mytawaran-heading">
						<DialogTitle>{t("aboutTitle")}</DialogTitle>
						<DialogDescription>{t("aboutDescription")}</DialogDescription>
					</div>
				</DialogHeader>
				<ol className="about-mytawaran-steps">
					{aboutRules.map((rule, index) => (
						<li key={rule.title}>
							<span className="about-mytawaran-step-index">{index + 1}</span>
							<div>
								<strong>{rule.title}</strong>
								<p>{rule.description}</p>
							</div>
						</li>
					))}
				</ol>
			</DialogContent>
		</Dialog>
	);
}

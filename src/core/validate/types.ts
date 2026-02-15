import type { Budget } from "../audit/types.js";

export interface SiteConfig {
	name: string;
	url: string;
	locale: string;
	timezone: string;
	titleDefault: string;
	descriptionDefault: string;
	social?: Record<string, string>;
	blog?: { basePath: string; postsPerPage: number };
	budgets?: Budget;
}

export type Budget = Readonly<{
	strict: boolean;
	maxTransferBytes?: number;
	maxRequests?: number;
	maxJsBytes?: number;
	maxCssBytes?: number;
	maxImageBytes?: number; //total images budget
	maxSingleImageBytes?: number; //single

	/** Paramètres d’estimation (optionnels) */
	estimate?: EstimateConfig;
}>;

export type AssetKind = "html" | "css" | "js" | "image" | "font" | "other";

export type AuditedAsset = Readonly<{
	/** Chemin relatif dans dist (POSIX-like recommandé pour la stabilité des rapports) */
	path: string;
	bytes: number;
	kind: AssetKind;
}>;

export type BudgetViolation = Readonly<{
	id: "transfer" | "requests" | "js" | "css" | "images" | "singleImage";
	message: string;
	actual: number;
	limit: number;
	unit: "bytes" | "count";
	/** delta = actual - limit (>= 0) */
	delta: number;
}>;

export type AuditTotals = Readonly<{
	transferBytes: number;
	requestCount: number;

	htmlBytes: number;
	cssBytes: number;
	jsBytes: number;
	imageBytes: number;
	fontBytes: number;
	otherBytes: number;
}>;

export type AuditReport = Readonly<{
	version: 1;
	generatedAt: string; // ISO
	distDir: string; // debug (ex: "dist")
	budget: Budget;
	totals: AuditTotals;

	/** Les plus gros fichiers (utile pour guider l’optimisation) */
	topAssets: ReadonlyArray<AuditedAsset>;

	estimated?: EstimateResult;

	violations: ReadonlyArray<BudgetViolation>;
	pass: boolean;
}>;

export type EstimateConfig = Readonly<{
	enabled: boolean;
	/**
	 * Coût fixe “proxy” par requête (headers, TLS, etc.) en bytes.
	 * Heuristique volontairement simple.
	 */
	requestOverheadBytes: number;
	/**
	 * Intensité énergétique réseau/datacenter (kWh par GB transféré).
	 * Heuristique configurable.
	 */
	kwhPerGB: number;
	/**
	 * Facteur d’émission gCO2e/kWh.
	 * Si absent => on calcule l’énergie mais pas le carbone.
	 */
	emissionFactor_gPerKwh?: number;
}>;
export type EstimateResult = Readonly<{
	model: Readonly<{
		version: 1;
		requestOverheadBytes: number;
		kwhPerGB: number;
		emissionFactor_gPerKwh?: number;
	}>;

	/** bytes “ajustés” = transferBytes + requestCount * overhead */
	adjustedTransferBytes: number;

	/** énergie estimée liée au transfert (kWh) */
	energy_kWh: number;

	/** carbone estimé (gCO2e), seulement si emissionFactor fourni */
	carbon_gCO2e?: number;
}>;

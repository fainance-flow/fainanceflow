/**
 * Pakistani Rupee formatting using the Indian/Pakistani lakh-crore grouping.
 * 150000 → "1,50,000"  (not 150,000)
 * 1500000 → "15,00,000"
 *
 * All money in this app flows through this helper — never call toLocaleString
 * directly on monetary values.
 */
export function formatPKR(value: number | string | undefined | null, opts?: { showSymbol?: boolean; signed?: boolean }): string {
  const showSymbol = opts?.showSymbol ?? true;
  const signed = opts?.signed ?? false;

  if (value === undefined || value === null || value === "") {
    return showSymbol ? "₨ —" : "—";
  }

  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return showSymbol ? "₨ —" : "—";

  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : signed ? "+" : "";

  // Split integer/decimal
  const [intPart, decPart] = abs.toFixed(2).split(".");
  if (!intPart) return showSymbol ? "₨ 0" : "0";

  // Pakistani grouping: last 3, then every 2
  const lastThree = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const grouped = rest
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
    : lastThree;

  const dec = decPart && decPart !== "00" ? `.${decPart}` : "";
  const out = `${sign}${grouped}${dec}`;
  return showSymbol ? `₨ ${out}` : out;
}

/**
 * Compact formatter for chart labels and small spaces:
 * 1,50,000 → "1.5L", 15,00,000 → "15L", 1,00,00,000 → "1Cr"
 */
export function formatPKRCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1_00_00_000) return `${sign}${(abs / 1_00_00_000).toFixed(abs >= 1_00_00_00_000 ? 0 : 1)}Cr`;
  if (abs >= 1_00_000) return `${sign}${(abs / 1_00_000).toFixed(abs >= 10_00_000 ? 0 : 1)}L`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return `${sign}${abs.toFixed(0)}`;
}

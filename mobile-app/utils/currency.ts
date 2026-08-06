/**
 * Pakistani Rupee formatting using lakh-crore grouping.
 * 150000 → "₨ 1,50,000"
 */
export function formatPKR(
  value: number | string | undefined | null,
  opts?: { showSymbol?: boolean; signed?: boolean }
): string {
  const showSymbol = opts?.showSymbol ?? true;
  const signed = opts?.signed ?? false;

  if (value === undefined || value === null || value === "") {
    return showSymbol ? "₨ —" : "—";
  }

  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return showSymbol ? "₨ —" : "—";

  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : signed ? "+" : "";
  const [intPart, decPart] = abs.toFixed(2).split(".");
  if (!intPart) return showSymbol ? "₨ 0" : "0";

  const lastThree = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree : lastThree;
  const dec = decPart && decPart !== "00" ? `.${decPart}` : "";
  const out = `${sign}${grouped}${dec}`;
  return showSymbol ? `₨ ${out}` : out;
}

export function formatPKRCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_00_00_000) return `${sign}${(abs / 1_00_00_000).toFixed(abs >= 1_00_00_00_000 ? 0 : 1)}Cr`;
  if (abs >= 1_00_000) return `${sign}${(abs / 1_00_000).toFixed(abs >= 10_00_000 ? 0 : 1)}L`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return `${sign}${abs.toFixed(0)}`;
}

export function parseMoney(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") return Number(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

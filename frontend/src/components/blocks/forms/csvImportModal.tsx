"use client";

import { useRef, useState } from "react";
import { Upload, AlertCircle, CheckCircle2, FileText, X } from "lucide-react";
import Button from "@components/common/Button";
import Modal from "@components/common/Modal";
import { useAccounts } from "@hooks/useAccounts";
import { useCreateTransaction } from "@hooks/useTransactions";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@utils/categories";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────
type ParsedRow = {
  line: number;
  date: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  walletName: string;
  walletId?: string;
  error?: string;
};

// ── CSV helpers ────────────────────────────────────────────────
const ALL_CATEGORIES = Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]));

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let inQuote = false;
  let cur = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseDate(raw: string): string | null {
  // Accepts: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, D MMM YYYY
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return raw;

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, d, m, y] = slash;
    return `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
  }
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

const EXPECTED_HEADERS = ["date", "type", "category", "description", "amount", "wallet"];

// ── Component ──────────────────────────────────────────────────
type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

const CsvImportModal = ({ open, onOpenChange }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: wallets = [] } = useAccounts();
  const create = useCreateTransaction();

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [importing, setImporting] = useState(false);

  const validRows = rows.filter((r) => !r.error);
  const errorRows = rows.filter((r) => r.error);

  const reset = (): void => {
    setRows([]);
    setFileName("");
    setStep("upload");
    if (fileRef.current) fileRef.current.value = "";
  };

  const close = (): void => {
    reset();
    onOpenChange(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error("CSV has no data rows.");
        return;
      }

      // Detect header
      const headerLine = lines[0]!.toLowerCase();
      const headers = parseCsvLine(headerLine);
      const hasHeader = EXPECTED_HEADERS.some((h) => headers.includes(h));
      const dataLines = hasHeader ? lines.slice(1) : lines;

      // Build wallet lookup (case-insensitive)
      const walletLookup = new Map(wallets.map((w) => [w.name.toLowerCase(), w]));

      const parsed: ParsedRow[] = dataLines
        .filter((l) => l.trim())
        .map((line, idx) => {
          const cols = parseCsvLine(line);
          const [rawDate = "", rawType = "", rawCat = "", rawDesc = "", rawAmt = "", rawWallet = ""] = cols;

          const lineNum = idx + (hasHeader ? 2 : 1);

          // Date
          const date = parseDate(rawDate.trim());
          if (!date) return { line: lineNum, date: "", type: "expense" as const, category: "", description: "", amount: 0, walletName: rawWallet, error: `Row ${lineNum}: invalid date "${rawDate}"` };

          // Check 2-year window
          const parsed2 = new Date(date);
          const twoYearsAgo = new Date();
          twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
          if (parsed2 < twoYearsAgo) return { line: lineNum, date, type: "expense" as const, category: "", description: "", amount: 0, walletName: rawWallet, error: `Row ${lineNum}: date is older than 2 years (${date})` };

          // Type
          const type = rawType.trim().toLowerCase();
          if (type !== "income" && type !== "expense") return { line: lineNum, date, type: "expense" as const, category: "", description: "", amount: 0, walletName: rawWallet, error: `Row ${lineNum}: type must be "income" or "expense"` };

          // Amount
          const amount = parseFloat(rawAmt.replace(/[^0-9.]/g, ""));
          if (isNaN(amount) || amount <= 0) return { line: lineNum, date, type: type as "income" | "expense", category: "", description: "", amount: 0, walletName: rawWallet, error: `Row ${lineNum}: invalid amount "${rawAmt}"` };

          // Category
          const cat = rawCat.trim();
          const category = (ALL_CATEGORIES.find((c) => c.toLowerCase() === cat.toLowerCase()) ?? cat) || "Other";

          // Wallet
          const wName = rawWallet.trim();
          const wallet = walletLookup.get(wName.toLowerCase());
          if (wallets.length > 0 && !wallet && wName) {
            return { line: lineNum, date, type: type as "income" | "expense", category, description: rawDesc.trim(), amount, walletName: wName, error: `Row ${lineNum}: wallet "${wName}" not found` };
          }

          return {
            line: lineNum,
            date,
            type: type as "income" | "expense",
            category,
            description: rawDesc.trim(),
            amount,
            walletName: wName || wallets[0]?.name || "",
            walletId: wallet?.id ?? wallets[0]?.id,
          };
        });

      setRows(parsed);
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const handleImport = async (): Promise<void> => {
    if (validRows.length === 0) return;
    setImporting(true);
    let ok = 0;
    let fail = 0;
    for (const row of validRows) {
      try {
        await create.mutateAsync({
          walletId: row.walletId ?? wallets[0]!.id,
          type: row.type,
          amount: row.amount,
          category: row.category,
          description: row.description || undefined,
          date: row.date,
        });
        ok++;
      } catch {
        fail++;
      }
    }
    setImporting(false);
    if (ok > 0) toast.success(`Imported ${ok} transaction${ok > 1 ? "s" : ""}.`);
    if (fail > 0) toast.error(`${fail} transaction${fail > 1 ? "s" : ""} failed to import.`);
    setStep("done");
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Import from CSV"
      description="Upload a CSV file with columns: date, type, category, description, amount, wallet"
    >
      {/* ── Step: Upload ── */}
      {step === "upload" && (
        <div className="space-y-5">
          {/* Drop zone */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-line-strong rounded-xl py-10 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/40 hover:bg-primary/4 transition-colors"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-ink">Click to upload CSV</p>
              <p className="text-xs text-faint mt-1">Supports up to 2 years of records</p>
            </div>
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />

          {/* Format hint */}
          <div className="rounded-xl border border-line-strong bg-surface-2/50 p-4 space-y-2">
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-faint">Expected CSV format</p>
            <code className="block text-xs text-muted font-mono leading-relaxed">
              date,type,category,description,amount,wallet<br />
              2025-05-01,expense,Food,Lunch at cafe,450,HBL Checking<br />
              2025-05-02,income,Salary,May salary,50000,HBL Checking
            </code>
            <p className="text-xs text-faint">
              · <strong className="text-muted">date</strong>: YYYY-MM-DD or DD/MM/YYYY<br />
              · <strong className="text-muted">type</strong>: <code>income</code> or <code>expense</code><br />
              · <strong className="text-muted">wallet</strong>: must match an existing wallet name<br />
              · Records older than 2 years are skipped
            </p>
          </div>
        </div>
      )}

      {/* ── Step: Preview ── */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted" />
            <span className="text-muted truncate flex-1">{fileName}</span>
            <button type="button" onClick={reset} className="text-faint hover:text-terra cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Summary badges */}
          <div className="flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald/10 border border-emerald/20 text-xs text-emerald font-mono">
              <CheckCircle2 className="h-3 w-3" />
              {validRows.length} valid
            </span>
            {errorRows.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terra/10 border border-terra/20 text-xs text-terra font-mono">
                <AlertCircle className="h-3 w-3" />
                {errorRows.length} with errors
              </span>
            )}
          </div>

          {/* Error list */}
          {errorRows.length > 0 && (
            <div className="rounded-xl border border-terra/20 bg-terra/5 p-3 space-y-1 max-h-32 overflow-y-auto">
              {errorRows.map((r) => (
                <p key={r.line} className="text-xs text-terra font-mono">{r.error}</p>
              ))}
            </div>
          )}

          {/* Preview table */}
          {validRows.length > 0 && (
            <div className="overflow-auto max-h-56 rounded-xl border border-line-strong">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-line-strong bg-surface-2">
                    {["Date", "Type", "Category", "Description", "Amount", "Wallet"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-mono text-[10px] tracking-wider uppercase text-faint">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {validRows.slice(0, 50).map((r) => (
                    <tr key={r.line} className="border-b border-line/40 hover:bg-surface-2/50 transition-colors">
                      <td className="px-3 py-2 font-mono text-muted">{r.date}</td>
                      <td className="px-3 py-2">
                        <span className={`font-mono uppercase tracking-wider ${r.type === "income" ? "text-emerald" : "text-terra"}`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-ink">{r.category}</td>
                      <td className="px-3 py-2 text-muted max-w-[120px] truncate">{r.description || "—"}</td>
                      <td className="px-3 py-2 font-mono font-semibold text-ink">{r.amount.toLocaleString()}</td>
                      <td className="px-3 py-2 text-muted">{r.walletName || "—"}</td>
                    </tr>
                  ))}
                  {validRows.length > 50 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-2 text-center text-xs text-faint">
                        … and {validRows.length - 50} more rows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={reset}>Back</Button>
            <Button
              variant="primary"
              loading={importing}
              disabled={validRows.length === 0}
              onClick={() => void handleImport()}
            >
              Import {validRows.length} row{validRows.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step: Done ── */}
      {step === "done" && (
        <div className="py-6 flex flex-col items-center gap-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-emerald/10 grid place-items-center">
            <CheckCircle2 className="h-8 w-8 text-emerald" />
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-ink">Import complete</p>
            <p className="text-sm text-muted mt-1">
              {validRows.length} transaction{validRows.length !== 1 ? "s" : ""} imported successfully.
            </p>
          </div>
          <Button variant="primary" onClick={close}>Done</Button>
        </div>
      )}
    </Modal>
  );
};

export default CsvImportModal;

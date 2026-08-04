/**
 * FinanceFlow — Personal Expense Seeder
 * Reads notepad files, parses expenses, outputs a browser-console snippet
 * that inserts all transactions into localStorage.
 *
 * Usage:
 *   node seed-expenses.js
 * Then paste the generated console-snippet.js into your browser DevTools console.
 */

const fs   = require("fs");
const path = require("path");
const crypto = require("crypto");

// ─── helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return (typeof crypto.randomUUID === "function")
    ? crypto.randomUUID()
    : `ff_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/** Parse "45k", "2.5k", "2,000", "2000", "25,000" → number */
function parseAmt(s) {
  if (!s) return null;
  s = s.trim().replace(/,/g, "").toLowerCase();
  const k = s.match(/^(\d+(?:\.\d+)?)\s*k$/);
  if (k) return Math.round(parseFloat(k[1]) * 1000);
  const n = s.match(/^(\d+(?:\.\d+)?)$/);
  if (n) return Math.round(parseFloat(n[1]));
  return null;
}

/** Map description → EXPENSE_CATEGORIES */
function categorize(desc) {
  const d = (desc || "").toLowerCase();
  if (/\bfuel\b|bike repair|bike exp|transport|ticket|helmet|ricksha|uber/.test(d))      return "Transport";
  if (/gym|health|doctor|medic|hospital|cutting|hair|barber|perfume|enchanter|spray|slipper|machine/.test(d)) return "Health";
  if (/net fee|internet|package|wifi|fiber|domain|canva|electric bill|easy pais|jazz cash|loan fee|challan|tax\b|plumber|repair/.test(d)) return "Bills";
  if (/\bfee\b|uni fee|university|school|college|course/.test(d))                        return "Education";
  if (/food|eat|breakfast|lunch|dinner|chai|roo\b|bun\b|lassi|fries|kfc|pizza|biryani|nasta|fast food|haveli|meetup|outing|treat|domino|faloda|mithai|ice.?cream|fruit|khana/.test(d)) return "Food";
  if (/cinema|movie|park|entertain|birthday|anniversary|aniversiry|valentines?|14 feb|new year|trip|tour/.test(d)) return "Entertainment";
  if (/shirt|trouser|jeans|shorts|shoe|sandal|cap|cloth|tailor|silai|joger|headphone|hand.?free|mobile|mic\b|converter|charger|chair|table|furniture|plant|stand|backrest|back rest|paint|watch|jewel|eidi|shopping|garmi/.test(d)) return "Shopping";
  return "Other";
}

function isoDate(year, month, day) {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}T12:00:00.000Z`;
}

/** Create a transaction object */
function tx(walletId, amount, category, description, year, month, day) {
  return {
    id:          uid(),
    walletId,
    type:        "expense",
    amount,
    category,
    description: description || null,
    date:        isoDate(year, month, day),
    tags:        [],
    createdAt:   new Date().toISOString(),
    historical:  true,
  };
}

// ─── parse a notepad line → {amount, description} or null ────────────────────
function parseLine(line) {
  line = line.trim();
  if (!line || line.startsWith("=") || line.startsWith("-") || line.startsWith("(")
    || /^[0-9,k\.]+\s*$/.test(line)          // bare total line
    || /^\d{2,3}k\s*$/.test(line.toLowerCase()) // "70k", "86k" totals
    || /^Break Up$|^M Calculation|^Month Start|^Home$|^Manage|^IMPROVEMENT/i.test(line)
    || /^Extra\s*$/i.test(line))
    return null;

  // "45k mama" | "45,000 mama"
  const frontAmt = line.match(/^([\d,\.]+k?)\s+(.+)/i);
  if (frontAmt) {
    const amt = parseAmt(frontAmt[1]);
    if (amt && amt >= 100 && amt <= 500000) return { amount: amt, description: frontAmt[2].trim() };
  }

  // "mama = 45,000" | "mama ko 45k"
  const backAmt = line.match(/^(.+?)\s*[=:]\s*([\d,\.]+k?)$/i);
  if (backAmt) {
    const amt = parseAmt(backAmt[2]);
    if (amt && amt >= 100 && amt <= 500000) return { amount: amt, description: backAmt[1].trim() };
  }

  // "mama ko dai =15,000" handled by backAmt
  // "chair repair(1300)" → special
  const parenAmt = line.match(/^(.+?)\((\d[\d,]*)\)\s*$/);
  if (parenAmt) {
    const amt = parseAmt(parenAmt[2]);
    if (amt && amt >= 100 && amt <= 500000) return { amount: amt, description: parenAmt[1].trim() };
  }

  // expressions like "Rameen Outing (200 +500 + 200+ 2000+ 500)=3500"
  const sumLine = line.match(/^(.+?)=(\d[\d,]*)$/);
  if (sumLine) {
    const amt = parseAmt(sumLine[2]);
    if (amt && amt >= 100 && amt <= 500000) return { amount: amt, description: sumLine[1].trim() };
  }

  return null;
}

// ─── manually curated expense data (from notepad files) ──────────────────────
// Format: [year, month, day, amount, description]
// "day" is approximate — spread across the month realistically

const EXPENSES = [
  // ════════════════════════════════════════════════════
  //  2025
  // ════════════════════════════════════════════════════

  // --- March 2025 ---
  [2025, 3,  1, 10000, "Ramzan expenses (first 8 roza)"],
  [2025, 3,  2, 40000, "Mama Eid"],
  [2025, 3,  5, 15000, "Chair (new)"],
  [2025, 3,  6,  2000, "Headphone"],
  [2025, 3,  7,  1000, "Misc expense"],
  [2025, 3,  8,  4000, "Parrots"],
  [2025, 3,  9,  2000, "Plants"],
  [2025, 3, 10,  1000, "Fuel"],
  [2025, 3, 20,  5000, "Aftari Haveli"],
  [2025, 3, 27,  8000, "Chand raat shopping"],
  [2025, 3, 28,  2500, "Tailor (silai)"],

  // --- April 2025 ---
  // Eid section (early April)
  [2025, 4,  1, 15000, "Mama Eid payment"],
  [2025, 4,  1,  2000, "Tahir"],
  [2025, 4,  2,  5000, "Jewellery Eidi"],
  [2025, 4,  2,  1500, "Outing with Api"],
  [2025, 4,  2,   500, "Papa cutting"],
  [2025, 4,  2,   500, "Munna Eid"],
  [2025, 4,  2,   300, "Fuel (Eid)"],
  [2025, 4,  2,  1000, "Eid breakfast"],
  [2025, 4,  2,  1000, "Misc Eid expense"],
  // Month expenses
  [2025, 4,  5, 45000, "Mama monthly"],
  [2025, 4,  6,  1700, "Outing with Khuzaima"],
  [2025, 4,  7,  1000, "Tahir loan"],
  [2025, 4,  8,  3500, "Rameen outing"],
  [2025, 4, 10,  1300, "Chair repair"],
  [2025, 4, 11,  3000, "Trousers & shirts"],
  [2025, 4, 12,  1000, "Juices & faloda"],
  [2025, 4, 13,  1700, "Internet package"],
  [2025, 4, 14,  1000, "Fuel (office)"],
  [2025, 4, 15,   700, "Fries roll samosa"],
  [2025, 4, 16,   550, "Fuel + naan + chai"],
  [2025, 4, 17,  1200, "Food outing (lassi, bun, roo)"],
  [2025, 4, 18,  1200, "Txel outing (fuel, ticket, food)"],
  [2025, 4, 19,  1000, "Shorts + guest expense"],
  [2025, 4, 20,  2000, "Bike repair"],
  [2025, 4, 21,  2000, "Summer trousers"],
  [2025, 4, 22,  1000, "Misc (cutting, fuel, parrots)"],
  [2025, 4, 23,   600, "Net fee"],
  [2025, 4, 25,  1000, "Extra"],

  // --- May 2025 ---
  [2025, 5,  1, 45000, "Mama monthly"],
  [2025, 5,  2,  2000, "R expense"],
  [2025, 5,  5, 12000, "Uni fee"],
  [2025, 5, 10,  6000, "Helmet"],
  [2025, 5, 12,  1000, "Fuel"],
  [2025, 5, 20, 20000, "R Birthday"],

  // --- June 2025 ---
  [2025, 6,  1, 55000, "iPhone"],
  [2025, 6,  3,  3000, "Mama birthday"],
  [2025, 6,  5,  8000, "Uni fee"],
  [2025, 6, 10,  2000, "Mobile package"],
  [2025, 6, 15,  3000, "Fuel (monthly)"],

  // --- July 2025 ---
  [2025, 7,  1, 45000, "Mama monthly"],
  [2025, 7,  2,  3000, "Kameti (Nazai)"],
  [2025, 7,  5,  7000, "Uni fee"],
  [2025, 7,  8,  1600, "Mobile package"],
  [2025, 7, 10,  3000, "Fuel"],
  [2025, 7, 15,  2000, "Haider"],
  [2025, 7, 18,  2000, "Gym fee"],
  [2025, 7, 20,  3000, "Personal expenses"],

  // --- August 2025 ---
  [2025, 8,  1, 45000, "Mama monthly"],
  [2025, 8,  3,  2000, "Gym fee"],
  [2025, 8,  5,  1200, "Haider Subhani"],
  [2025, 8,  7,  5000, "Haider cousin outing"],
  [2025, 8, 10,  3500, "Domain renewal"],
  [2025, 8, 12,  1600, "Jazz Cash loan"],
  [2025, 8, 14,  5000, "Fiber internet"],
  [2025, 8, 16,  2000, "Bike expense"],
  [2025, 8, 18,  3000, "Investment (Khuzaima)"],
  [2025, 8, 20,  2000, "Misc expenses"],

  // --- September 2025 ---
  [2025, 9,  1, 45000, "Mama monthly"],
  [2025, 9,  2,  2000, "Baba"],
  [2025, 9,  3,  2000, "Gym fee"],
  [2025, 9,  4,  3000, "Net fee"],
  [2025, 9,  5,  2000, "Jazz Cash loan"],
  [2025, 9,  8,  4000, "Fuel"],
  [2025, 9, 10,  3000, "Misc expense"],
  [2025, 9, 12,  4000, "Uni fee"],
  [2025, 9, 14,  1000, "Slipper"],
  [2025, 9, 16,  2000, "Perfume + Enchanter"],
  [2025, 9, 18,  2000, "Machine"],
  [2025, 9, 20,  2000, "Food"],

  // --- October 2025 ---
  [2025, 10,  1, 46000, "Mama monthly"],
  [2025, 10,  2,  2000, "Baba"],
  [2025, 10,  3,  1000, "Net fee"],
  [2025, 10,  4,  2000, "Easy Paisa loan"],
  [2025, 10,  5,  2000, "Gym fee"],
  [2025, 10,  7,  2000, "Mobile package"],
  [2025, 10, 10,  6000, "Ali"],
  [2025, 10, 12,  2000, "Shirts"],
  [2025, 10, 15,  2000, "Bike expense"],
  [2025, 10, 18,  1000, "Outing with Tayyab"],
  [2025, 10, 20,  4000, "Fuel"],

  // --- November 2025 ---
  [2025, 11,  1, 47000, "Mama monthly"],
  [2025, 11,  2,   500, "Fuel"],
  [2025, 11,  3,   500, "Fast food"],
  [2025, 11,  4,   300, "Water bottle"],
  [2025, 11,  5,   700, "Cutting & styling"],
  [2025, 11,  6,   500, "Fuel"],
  [2025, 11,  7,  1300, "Phone stand"],
  [2025, 11,  8,  8000, "Uni fee"],
  [2025, 11,  9,  1000, "Net fee"],
  [2025, 11, 10,  2000, "Gym fee"],
  [2025, 11, 12,   500, "Friends outing"],
  [2025, 11, 14,  3000, "Anniversary gift"],
  [2025, 11, 16,  6000, "Birthday expense"],
  [2025, 11, 18,  4500, "Khala meetup"],
  [2025, 11, 20,   750, "Tayyab"],
  [2025, 11, 22,  2000, "Talha"],
  [2025, 11, 24,  2500, "Joggers"],
  [2025, 11, 25,  1500, "Mobile package"],
  [2025, 11, 26,  1000, "Cap + fuel"],
  [2025, 11, 27,  3000, "Paint shirts"],

  // --- December 2025 ---
  [2025, 12,  1, 45000, "Mama monthly (+ loan 6k)"],
  [2025, 12,  2,  5000, "Easy Paisa loan"],
  [2025, 12,  3,  2000, "Talha"],
  [2025, 12,  5,  3000, "Uni fee"],
  [2025, 12,  6,  2000, "Gym fee"],
  [2025, 12,  7,  1000, "Net fee"],
  [2025, 12, 10,  3000, "Fuel"],
  [2025, 12, 15,  3000, "R meetups"],
  [2025, 12, 16,  2000, "Talha salami"],
  [2025, 12, 18,  1000, "Hair & cutting"],
  [2025, 12, 20,  2000, "Bike expense"],
  [2025, 12, 22,  2000, "Mobile package"],
  [2025, 12, 24,  1000, "Baba"],

  // ════════════════════════════════════════════════════
  //  2026
  // ════════════════════════════════════════════════════

  // --- January 2026 ---
  [2026, 1,  1, 45000, "Mama monthly"],
  [2026, 1,  2,  1000, "Net fee"],
  [2026, 1,  3,  3000, "Loan payment"],
  [2026, 1,  4,  4000, "Mic"],
  [2026, 1,  5,  2000, "Converter"],
  [2026, 1,  6,  2000, "Challan"],
  [2026, 1,  7,  3000, "Fuel"],
  [2026, 1,  8,  2000, "Personal expenses"],
  [2026, 1,  9,  1000, "Baba"],
  [2026, 1, 10,  1000, "Canva + Api ghar expense"],
  [2026, 1, 11,  3000, "Shoes"],
  [2026, 1, 12,  2000, "Paint"],
  [2026, 1, 13,  1000, "Annual Dinner"],
  [2026, 1, 15,  2000, "Mobile package"],
  [2026, 1, 16,  3000, "Uni fee"],
  [2026, 1, 18,  4000, "R New Year outing"],
  [2026, 1, 20,  2000, "Gifts"],
  [2026, 1, 22,  1000, "Meetup"],
  [2026, 1, 24,  1000, "Handfree + food"],
  [2026, 1, 25,  4000, "Loan (new)"],

  // --- February 2026 ---
  [2026, 2,  1, 50000, "Mama monthly"],
  [2026, 2,  2,  2000, "Baba"],
  [2026, 2,  3,  2000, "Basant (fuel + food + bike clean)"],
  [2026, 2,  5, 27000, "Haider (rashan 24k + phone 3k)"],
  [2026, 2,  6,  5000, "Loan payment"],
  [2026, 2,  7,  2000, "Gym fee"],
  [2026, 2,  8,  1000, "Net fee"],
  [2026, 2,  9,  3000, "Helmet"],
  [2026, 2, 14,  2000, "14 Feb (Valentine)"],
  [2026, 2, 15,  2000, "Mobile package"],
  [2026, 2, 16,  4000, "Bike (magrara, engine oil)"],
  [2026, 2, 17,  2000, "R dinner"],
  [2026, 2, 18,  4000, "Haider Jame Shiri addition"],
  [2026, 2, 19,  3000, "Sajjad Mamu"],
  [2026, 2, 20,  1000, "Plumber repair"],
  [2026, 2, 21,  2000, "Food + fuel"],
  [2026, 2, 22,  5000, "Tax"],
  [2026, 2, 23,  3000, "Headphone"],
  [2026, 2, 24,  1000, "Fuel"],

  // --- March 2026 ---
  [2026, 3,  1, 50000, "Mama monthly"],
  [2026, 3,  2,  5000, "Tax"],
  [2026, 3,  3,  1000, "Net fee"],
  [2026, 3,  4,  3000, "Uni fee"],
  [2026, 3,  5,  2000, "Shirts"],
  [2026, 3,  6,  2000, "Mobile package"],
  [2026, 3,  7,  3000, "Silai (tailor)"],
  [2026, 3,  8,  1000, "Baba"],
  // Eid expenses (late March)
  [2026, 3, 22,  2000, "Mama Eidi"],
  [2026, 3, 22,  1000, "Baba Eidi"],
  [2026, 3, 22,  1000, "Bacha Eidi"],
  [2026, 3, 23,  2000, "Paint"],
  [2026, 3, 23,  2000, "Shoes (Eid)"],
  [2026, 3, 23,  1000, "Cutting (Eid)"],
  [2026, 3, 24,  2000, "Asad meetup"],
  [2026, 3, 24,  1000, "Awais KFC"],
  [2026, 3, 24,  2000, "Home expense (gajra, food, fuel)"],
  [2026, 3, 25,  1000, "Gift meetup"],
  [2026, 3, 25,  1000, "Ice cream + mithai"],
  [2026, 3, 26,  2000, "Mehndi + chai + fuel"],
  [2026, 3, 27,  5000, "Haveli & Badshahi Masjid outing"],
  [2026, 3, 28,  7000, "Watch + shopping + churain"],
  [2026, 3, 29,  1000, "After iftar (ice cream, fuel)"],
  [2026, 3, 29,  1000, "Food"],
  [2026, 3, 30,  2000, "Chair repair"],
  [2026, 3, 30,  1000, "Food"],

  // --- April 2026 ---
  [2026, 4,  1, 50000, "Mama monthly"],
  [2026, 4,  2,  2000, "Mobile package"],
  [2026, 4,  3,  6000, "Uni fee"],
  [2026, 4,  4,  2000, "Bike expense"],
  [2026, 4,  4,  2000, "Baba"],
  [2026, 4,  5,  2000, "Food"],
  [2026, 4,  6,  1000, "Cat advance"],
  [2026, 4,  7,  1000, "iPhone charger"],
  [2026, 4,  7,  1000, "Net fee"],
  [2026, 4,  8,  4000, "Back rest (ergonomic)"],
  [2026, 4,  9,  1000, "Lawyer fee"],
  [2026, 4, 10,  2000, "Api treat"],
  [2026, 4, 11,  2000, "R casual outing"],
  [2026, 4, 12,  2000, "Fuel"],
  [2026, 4, 13, 22000, "New chair (paid 22k, sold old 10k)"],
  [2026, 4, 14, 10000, "Table"],
  [2026, 4, 15,  2000, "Fuel + rent"],
  [2026, 4, 16,  2000, "Guest (Nazai)"],
  [2026, 4, 17,  2000, "Home treat"],
  [2026, 4, 18, 10000, "Mama advance"],
  [2026, 4, 19,  1500, "Mama again"],
  [2026, 4, 20,  2000, "Fruits"],
  [2026, 4, 21,  2000, "Fuel"],
  [2026, 4, 22,  4000, "Food"],
  [2026, 4, 23,  4000, "R outing"],
  [2026, 4, 24,  1000, "Handfree + charger"],
  [2026, 4, 25,  2000, "Home (button, dimmer, remote, tissue)"],
];

// ─── build transactions ───────────────────────────────────────────────────────

function buildTransactions(walletId) {
  return EXPENSES.map(([year, month, day, amount, description]) => ({
    id:          uid(),
    walletId,
    type:        "expense",
    amount,
    category:    categorize(description),
    description: description || null,
    date:        isoDate(year, month, day),
    tags:        [],
    createdAt:   new Date().toISOString(),
    historical:  true,
  }));
}

// ─── generate browser console snippet ────────────────────────────────────────

const transactions = buildTransactions("__WALLET_ID__");

const snippet = `
// FinanceFlow — Expense Seeder
// Paste this in your browser DevTools console while the app is open.
// Make sure you're on the app page (not a blank tab).

(function() {
  const KEY = "financeflow:v1";
  const raw = localStorage.getItem(KEY);

  let state;
  try { state = raw ? JSON.parse(raw) : null; } catch(e) { state = null; }

  if (!state || state.version !== 1) {
    alert("No FinanceFlow data found. Please create a wallet first, then run this script.");
    return;
  }

  const wallets = state.wallets || [];
  if (wallets.length === 0) {
    alert("No wallets found. Create a wallet in the app first.");
    return;
  }

  // Use first wallet automatically
  const walletId = wallets[0].id;
  console.log("Using wallet:", wallets[0].name, "(id:", walletId + ")");

  const newTx = ${JSON.stringify(transactions, null, 2)};

  // Patch walletId
  newTx.forEach(t => t.walletId = walletId);

  // Skip duplicates by description+date
  const existing = new Set(
    (state.transactions || []).map(t => t.description + "|" + t.date.slice(0,10))
  );
  const toInsert = newTx.filter(t => !existing.has(t.description + "|" + t.date.slice(0,10)));

  state.transactions = [...(state.transactions || []), ...toInsert];
  localStorage.setItem(KEY, JSON.stringify(state));

  console.log("✅ Inserted", toInsert.length, "expenses. Skipped", newTx.length - toInsert.length, "duplicates.");
  console.log("Reload the page to see changes.");

  // Auto reload
  setTimeout(() => location.reload(), 1000);
})();
`;

const outPath = path.join(__dirname, "console-snippet.js");
fs.writeFileSync(outPath, snippet.trim(), "utf8");

console.log(`\n✅ Done! Generated: console-snippet.js`);
console.log(`   Total expenses: ${transactions.length}`);
console.log(``);
console.log(`Next steps:`);
console.log(`  1. Open your FinanceFlow app in the browser`);
console.log(`  2. Make sure you have at least ONE wallet created in the app`);
console.log(`  3. Open DevTools (F12) → Console tab`);
console.log(`  4. Copy contents of console-snippet.js and paste + Enter`);
console.log(`  5. Page will auto-reload with all expenses loaded!`);

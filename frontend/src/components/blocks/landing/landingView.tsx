"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowLeftRight,
  PieChart,
  Target,
  CreditCard,
  BarChart3,
  ShieldCheck,
  Zap,
  Globe,
  ArrowRight,
  ArrowUpRight,
  Check,
  Menu,
  X,
} from "lucide-react";
import Button from "@components/common/Button";
import ThemeSwitch from "@components/common/ThemeSwitch";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#preview", label: "Preview" },
];

const FEATURES = [
  {
    icon: Wallet,
    title: "Accounts & wallets",
    body: "Banks, cash and mobile money in one place. Balances update automatically as you log activity.",
  },
  {
    icon: ArrowLeftRight,
    title: "Transactions",
    body: "Income, expenses and transfers — categorised, searchable, and easy to import from CSV.",
  },
  {
    icon: PieChart,
    title: "Budgets",
    body: "Set monthly limits per category and get a clear read on what's left before you overspend.",
  },
  {
    icon: Target,
    title: "Savings goals",
    body: "Name a goal, set a target, and watch progress build with every contribution you make.",
  },
  {
    icon: CreditCard,
    title: "Subscriptions",
    body: "Never get surprised by a renewal again. See what's due this week, all in one view.",
  },
  {
    icon: BarChart3,
    title: "Reports",
    body: "Trends, heatmaps, weekend spend and net-worth tracking — export the whole ledger anytime.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Add your wallets",
    body: "Create accounts for every bank, cash stash and mobile wallet you use.",
  },
  {
    n: "02",
    title: "Log what moves",
    body: "Record income and expenses in seconds, or import a statement as CSV.",
  },
  {
    n: "03",
    title: "See the whole picture",
    body: "Budgets, goals and reports turn your entries into decisions you can act on.",
  },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Use it fully offline — your data can stay in your browser, never leaving your device.",
  },
  {
    icon: Globe,
    title: "PKR, done right",
    body: "Built for Pakistan. Rupees are formatted the way you actually read them.",
  },
  {
    icon: Zap,
    title: "Fast & focused",
    body: "A calm, keyboard-friendly interface that gets out of your way. No clutter, no ads.",
  },
];

const LandingView = () => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  return (
    <div className="ff-landing">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="ff-landing__nav">
        <div className="ff-landing__nav-inner">
          <Link href="/" className="brand" aria-label="FinanceFlow home">
            <span className="mark">f</span>
            <span>Finance<em>Flow</em></span>
          </Link>

          <nav className="links" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="actions">
            <ThemeSwitch />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild variant="primary" size="sm">
              <Link href="/register">Get started</Link>
            </Button>
            <button
              type="button"
              className="menu-btn"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="ff-landing__mobile-menu">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
                {l.label}
              </a>
            ))}
            <Link href="/login" onClick={() => setMenuOpen(false)}>
              Log in
            </Link>
          </div>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="ff-landing__hero">
        <span className="hero-aura" aria-hidden />
        <div className="hero-copy">
          <span className="editorial-rule">Personal finance · Pakistan</span>
          <h1>
            Every rupee, <em>accounted for</em>.
          </h1>
          <p className="lede">
            Track accounts, budgets, goals and subscriptions in one calm ledger — PKR-first,
            private by default, and beautiful on every screen.
          </p>
          <div className="hero-cta">
            <Button asChild size="lg" variant="primary">
              <Link href="/register">
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
          <ul className="hero-trust">
            <li>
              <Check className="h-3.5 w-3.5" /> No card required
            </li>
            <li>
              <Check className="h-3.5 w-3.5" /> Works offline
            </li>
            <li>
              <Check className="h-3.5 w-3.5" /> Free to start
            </li>
          </ul>
        </div>

        {/* Product mockup */}
        <div className="hero-visual" aria-hidden>
          <div className="app-mock">
            <div className="app-mock__bar">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
              <span className="title">FinanceFlow · Dashboard</span>
            </div>
            <div className="app-mock__body">
              <div className="balance">
                <span className="k">Total balance · all wallets</span>
                <div className="fig">
                  <span className="cur">₨</span>
                  <span className="amt">482,600</span>
                  <span className="chg">
                    <ArrowUpRight className="h-3 w-3" /> +12.4%
                  </span>
                </div>
              </div>

              <div className="bars">
                {[42, 58, 48, 66, 54, 78, 62, 88, 70, 96, 82, 90].map((h, i) => (
                  <span key={i} style={{ height: `${h}%` }} />
                ))}
              </div>

              <div className="tiles">
                <div className="tile up">
                  <span>Income</span>
                  <strong>₨ 92,400</strong>
                </div>
                <div className="tile down">
                  <span>Expense</span>
                  <strong>₨ 58,100</strong>
                </div>
                <div className="tile accent">
                  <span>Saved</span>
                  <strong>37%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ────────────────────────────────────── */}
      <section className="ff-landing__trust">
        <span className="label">Plays nicely with</span>
        <div className="logos">
          {["HBL", "Meezan", "UBL", "JazzCash", "Easypaisa", "SadaPay", "NayaPay"].map((b) => (
            <span key={b} className="chip">
              {b}
            </span>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section id="features" className="ff-landing__section">
        <div className="section-head">
          <span className="editorial-rule">What's inside</span>
          <h2>
            Everything to run your money, <em>nothing you don&rsquo;t need</em>.
          </h2>
          <p>
            One focused workspace for accounts, spending, budgets and goals — designed to make the
            next decision obvious.
          </p>
        </div>

        <div className="feature-grid">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article key={title} className="feature-card">
              <span className="ic">
                <Icon className="h-5 w-5" />
              </span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section id="how" className="ff-landing__section ff-landing__steps">
        <div className="section-head">
          <span className="editorial-rule">How it works</span>
          <h2>Up and running in three steps.</h2>
        </div>

        <div className="steps-grid">
          {STEPS.map((s) => (
            <article key={s.n} className="step-card">
              <span className="num">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Preview / values ───────────────────────────────── */}
      <section id="preview" className="ff-landing__section ff-landing__values">
        <div className="section-head">
          <span className="editorial-rule">Why FinanceFlow</span>
          <h2>Built to be trusted with your numbers.</h2>
        </div>

        <div className="values-grid">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <article key={title} className="value-card">
              <span className="ic">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="ff-landing__cta">
        <div className="cta-card">
          <span className="cta-aura" aria-hidden />
          <span className="editorial-rule">Start today</span>
          <h2>
            Your money, <em>finally organized</em>.
          </h2>
          <p>Set up your first wallet in under a minute. No card, no clutter, no noise.</p>
          <div className="cta-actions">
            <Button asChild size="lg" variant="primary">
              <Link href="/register">
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="ff-landing__footer">
        <div className="foot-inner">
          <div className="foot-brand">
            <Link href="/" className="brand">
              <span className="mark">f</span>
              <span>Finance<em>Flow</em></span>
            </Link>
            <p>Your money, elevated — a calm, PKR-first personal finance tracker.</p>
          </div>

          <div className="foot-cols">
            <div className="col">
              <span className="h">Product</span>
              <a href="#features">Features</a>
              <a href="#how">How it works</a>
              <a href="#preview">Why FinanceFlow</a>
            </div>
            <div className="col">
              <span className="h">Get started</span>
              <Link href="/register">Create account</Link>
              <Link href="/login">Log in</Link>
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} FinanceFlow</span>
          <span>Built in Karachi · PKR-first</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;

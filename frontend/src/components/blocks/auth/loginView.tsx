import Link from "next/link";
import { Wallet, PieChart, ShieldCheck, ArrowUpRight } from "lucide-react";
import AuthForm from "@components/blocks/forms/authForm";

const FEATURES = [
  { icon: Wallet, label: "Every wallet, one ledger", sub: "HBL · Meezan · JazzCash · cash" },
  { icon: PieChart, label: "Budgets, goals & reports", sub: "See where each rupee goes" },
  { icon: ShieldCheck, label: "Private by default", sub: "Works fully offline in your browser" },
];

const LoginView = () => {
  return (
    <div className="ff-auth">
      <section className="ff-auth__cover">
        <span className="ledger" aria-hidden />
        <span className="cover-aura" aria-hidden />

        {/* Brand */}
        <div className="cover-brand">
          <span className="mark">f</span>
          <span>
            Finance<em>Flow</em>
          </span>
        </div>

        {/* Editorial hero + product preview */}
        <div className="cover-hero">
          <span className="editorial-rule">Personal finance · Karachi</span>
          <p className="quote">
            Money is most fluent when it&rsquo;s <em>told</em> what to do.
          </p>
          <p className="cover-sub">Yours, in plain Pakistani — every rupee, formatted right.</p>

          {/* Live-style preview card */}
          <div className="cover-preview" aria-hidden>
            <div className="cover-preview__head">
              <span className="k">Total balance · all wallets</span>
              <span className="tag">
                <ArrowUpRight className="h-3 w-3" /> +12.4%
              </span>
            </div>
            <div className="cover-preview__figure">
              <span className="cur">₨</span>
              <span className="amt">482,600</span>
            </div>
            <div className="cover-preview__spark">
              {[38, 52, 44, 61, 55, 72, 66, 84].map((h, i) => (
                <span key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="cover-preview__pills">
              <span className="pill">
                <i style={{ background: "#1d4ed8" }} /> HBL · 312k
              </span>
              <span className="pill">
                <i style={{ background: "#0ecb81" }} /> Cash · 96k
              </span>
              <span className="pill">
                <i style={{ background: "#7c3aed" }} /> Savings · 74k
              </span>
            </div>
          </div>
        </div>

        {/* Features + attribution */}
        <div className="cover-foot">
          <ul className="cover-features">
            {FEATURES.map(({ icon: Icon, label, sub }) => (
              <li key={label}>
                <span className="ic">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="tx">
                  <strong>{label}</strong>
                  <em>{sub}</em>
                </span>
              </li>
            ))}
          </ul>
          <p className="attribution">FF Editorial · Vol. 01 · 2026</p>
        </div>
      </section>

      <section className="ff-auth__panel">
        <div className="ff-auth__form animate-fade-up">
          {/* Mobile brand (cover is hidden on small screens) */}
          <div className="brand-mobile">
            <span className="mark">f</span>
            <span>
              Finance<em>Flow</em>
            </span>
          </div>

          <span className="editorial-rule">Welcome back</span>
          <h1>Sign in to your ledger.</h1>
          <p className="lede">
            Track every rupee — across HBL, Meezan, JazzCash and whatever else you carry. PKR,
            formatted right.
          </p>
          <AuthForm mode="login" />
          <p className="ff-auth__switch">
            New here? <Link href="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default LoginView;

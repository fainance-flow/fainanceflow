import Link from "next/link";
import { Wallet, Target, ShieldCheck, ArrowUpRight } from "lucide-react";
import AuthForm from "@components/blocks/forms/authForm";

const FEATURES = [
  { icon: Wallet, label: "Add all your wallets", sub: "Banks, cash & mobile money" },
  { icon: Target, label: "Set goals & budgets", sub: "Save with intent, month by month" },
  {
    icon: ShieldCheck,
    label: "No account required",
    sub: "Start offline — sync later if you want",
  },
];

const RegisterView = () => {
  return (
    <div className="ff-auth">
      <section className="ff-auth__cover">
        <span className="ledger" aria-hidden />
        <span className="cover-aura" aria-hidden />

        <div className="cover-brand">
          <span className="mark">f</span>
          <span>
            Finance<em>Flow</em>
          </span>
        </div>

        <div className="cover-hero">
          <span className="editorial-rule">A fresh start</span>
          <p className="quote">
            Open a new <em>ledger</em>.
          </p>
          <p className="cover-sub">A fresh page for your rupees — set up in under a minute.</p>

          <div className="cover-preview" aria-hidden>
            <div className="cover-preview__head">
              <span className="k">Projected savings · 6 months</span>
              <span className="tag">
                <ArrowUpRight className="h-3 w-3" /> on track
              </span>
            </div>
            <div className="cover-preview__figure">
              <span className="cur">₨</span>
              <span className="amt">240,000</span>
            </div>
            <div className="cover-preview__spark">
              {[30, 40, 46, 55, 60, 68, 78, 90].map((h, i) => (
                <span key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="cover-preview__pills">
              <span className="pill">
                <i style={{ background: "#fcd535" }} /> Emergency · 120k
              </span>
              <span className="pill">
                <i style={{ background: "#0ecb81" }} /> Umrah · 80k
              </span>
            </div>
          </div>
        </div>

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
          <div className="brand-mobile">
            <span className="mark">f</span>
            <span>
              Finance<em>Flow</em>
            </span>
          </div>

          <span className="editorial-rule">New account</span>
          <h1>Start your ledger.</h1>
          <p className="lede">
            Track every rupee — across HBL, Meezan, JazzCash and whatever else you carry. PKR,
            formatted right.
          </p>
          <AuthForm mode="register" />
          <p className="ff-auth__switch">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default RegisterView;

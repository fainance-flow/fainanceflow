"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, X } from "lucide-react";
import Button from "@components/common/Button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function noopSubscribe(): () => void {
  return () => {};
}

function isIosDevice(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandaloneDisplay(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/**
 * Mobile-only "install this app" prompt. Android/desktop gets the real
 * beforeinstallprompt flow; iOS has no such API, so it shows the manual
 * Share -> Add to Home Screen steps instead. Hidden once already installed.
 * Dismissal is in-memory only (resets on reload) — reappears next visit
 * for as long as the underlying eligibility still holds.
 */
export default function PWAInstallBanner(): React.ReactNode {
  // useSyncExternalStore avoids a hydration mismatch for these browser-only
  // reads without a mounted-flag effect (isIosDevice/isStandaloneDisplay
  // don't change mid-session, so a no-op subscribe is correct here).
  const isIos = useSyncExternalStore(noopSubscribe, isIosDevice, () => false);
  const isStandalone = useSyncExternalStore(noopSubscribe, isStandaloneDisplay, () => false);

  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (isStandalone || dismissed) return null;
  if (!isIos && !installEvent) return null;

  return (
    <div className="md:hidden fixed bottom-20 left-4 right-4 z-40 flex items-center gap-3 rounded-xl border border-line-strong bg-surface p-3 shadow-elevated animate-fade-up">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
        <Download className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-ink">Install FinanceFlow</p>
        <p className="text-[11px] leading-tight text-muted">
          {isIos
            ? "Tap Share, then “Add to Home Screen”"
            : "Add it to your home screen for quick, app-like access"}
        </p>
      </div>
      {!isIos && (
        <Button
          size="sm"
          variant="gold"
          onClick={() => {
            void installEvent?.prompt();
            setInstallEvent(null);
          }}
        >
          Install
        </Button>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        className="text-muted hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

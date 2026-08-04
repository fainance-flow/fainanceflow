"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

type Props = {
  className?: string;
};

const ThemeSwitch = ({ className = "" }: Props) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Avoid hydration mismatch — render neutral state until mounted
  const isDark = mounted ? resolvedTheme === "dark" : false;

  const toggle = () => setTheme(isDark ? "light" : "dark");

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={[
        "group relative inline-flex items-center rounded-md cursor-pointer",
        "h-9 w-9 shrink-0 border border-line-strong bg-surface",
        "text-muted hover:text-ink hover:border-muted transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/55",
        className,
      ].join(" ")}
    >
      <span className="m-auto">
        {isDark ? (
          <Sun className="h-4 w-4" strokeWidth={2} />
        ) : (
          <Moon className="h-4 w-4" strokeWidth={2} />
        )}
      </span>
    </button>
  );
};

export default ThemeSwitch;

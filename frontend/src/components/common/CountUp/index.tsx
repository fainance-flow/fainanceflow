"use client";

import { useEffect, useRef, useState } from "react";
import { formatPKR } from "@utils/currency";

type Props = {
  to: number;
  duration?: number;
  format?: (v: number) => string;
  className?: string;
  raw?: boolean;
};

const CountUp = ({ to, duration = 1400, format, className, raw = false }: Props) => {
  const [value, setValue] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(to);
      return;
    }
    startRef.current = null;
    const tick = (ts: number): void => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(to * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [to, duration]);

  const formatter = format ?? ((v: number): string => formatPKR(v, { showSymbol: !raw }));
  return <span className={className}>{formatter(value)}</span>;
};

export default CountUp;

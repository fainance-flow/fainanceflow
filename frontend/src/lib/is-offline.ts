/**
 * True only when the browser is certain there's no network interface at all —
 * airplane mode, wifi and cellular both off. A fast, synchronous check so those
 * cases can skip straight to the offline fallback instead of waiting out a
 * request timeout first. Doesn't catch "connected but no real internet" (weak
 * signal, captive portal) — those still fall through to the normal
 * request-then-timeout-then-fallback path, since the browser can't know in
 * advance that they'll fail.
 */
export function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

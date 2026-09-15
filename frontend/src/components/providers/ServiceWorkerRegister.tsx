"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/** Registers the PWA service worker (production only) and surfaces update-available via a toast. */
export default function ServiceWorkerRegister(): null {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let refreshed = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshed) return;
      refreshed = true;
      window.location.reload();
    });

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            toast("A new version is available.", {
              duration: Infinity,
              action: {
                label: "Reload",
                onClick: () => newWorker.postMessage({ type: "SKIP_WAITING" }),
              },
            });
          }
        });
      });
    });
  }, []);

  return null;
}

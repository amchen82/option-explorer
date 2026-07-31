"use client";

import { useEffect } from "react";

/**
 * Applies native-only shell styling. No-ops in the browser, so the web app is
 * unaffected — the Capacitor packages are only imported once we know we are
 * running inside the native webview.
 */
export default function NativeChrome() {
  useEffect(() => {
    let cancelled = false;

    async function applyNativeStyling() {
      const { Capacitor } = await import("@capacitor/core");

      if (cancelled || !Capacitor.isNativePlatform()) {
        return;
      }

      const { StatusBar, Style } = await import("@capacitor/status-bar");

      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#0b0e11" });
      } catch {
        // StatusBar styling is cosmetic; a failure must never block the app.
      }
    }

    void applyNativeStyling();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

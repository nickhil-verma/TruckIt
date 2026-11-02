"use client";

import mixpanel from "mixpanel-browser";

let initialized = false;

/**
 * Initializes Mixpanel securely and idempotently in the browser.
 * Returns true if successfully initialized, false otherwise.
 */
export function initMixpanel(): boolean {
  if (typeof window === "undefined") return false;
  if (initialized) return true;

  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

  if (!token || typeof token !== "string" || token.trim() === "") {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Mixpanel: NEXT_PUBLIC_MIXPANEL_TOKEN is not configured.");
    }
    return false;
  }

  try {
    mixpanel.init(token, {
      autocapture: false,
      track_pageview: false,
      persistence: "localStorage",
      ignore_dnt: false,
      loaded: () => {
        if (process.env.NODE_ENV !== "production") {
          console.debug("Mixpanel client initialized successfully.");
        }
      },
    });

    initialized = true;
    return true;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Mixpanel initialization error (non-fatal):", err);
    }
    return false;
  }
}

/**
 * Tracks a custom event in Mixpanel safely with sanitization.
 * Never throws errors to protect booking, routing, and payment workflows.
 */
export function trackEvent(
  eventName: string,
  properties: Record<string, string | number | boolean | null | undefined> = {}
) {
  if (typeof window === "undefined" || !eventName) return;

  // Auto-init on first track call if not already done
  if (!initialized) {
    const ready = initMixpanel();
    if (!ready) return;
  }

  try {
    // Sanitize properties to prevent accidental PII/secrets or undefined values
    const safeProps: Record<string, string | number | boolean | null> = {};
    for (const [key, val] of Object.entries(properties)) {
      if (val === undefined) continue;
      // Exclude potential sensitive keys
      const lower = key.toLowerCase();
      if (
        lower.includes("password") ||
        lower.includes("secret") ||
        lower.includes("token") ||
        lower.includes("key") ||
        lower.includes("card") ||
        lower.includes("cvv")
      ) {
        continue;
      }
      safeProps[key] = val;
    }

    mixpanel.track(eventName, safeProps);
  } catch (err) {
    // Graceful catch ensures analytics never interrupts user workflow (e.g. ad blockers)
    if (process.env.NODE_ENV !== "production") {
      console.debug(`Mixpanel track notice [${eventName}]:`, err);
    }
  }
}

/**
 * Identifies an authenticated user in Mixpanel.
 */
export function identifyUser(userId: string, userProperties?: Record<string, string | number | boolean | null>) {
  if (typeof window === "undefined" || !userId) return;

  if (!initialized) {
    const ready = initMixpanel();
    if (!ready) return;
  }

  try {
    mixpanel.identify(userId);
    if (userProperties && mixpanel.people && typeof mixpanel.people.set === "function") {
      mixpanel.people.set(userProperties);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("Mixpanel identify notice:", err);
    }
  }
}

/**
 * Resets user identity upon logout.
 */
export function resetMixpanelUser() {
  if (typeof window === "undefined" || !initialized) return;

  try {
    mixpanel.reset();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("Mixpanel reset notice:", err);
    }
  }
}
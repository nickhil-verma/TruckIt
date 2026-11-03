"use client";

import * as amplitude from "@amplitude/analytics-browser";

let initialized = false;
let initializationAttempted = false;

/** Initialize Browser SDK 2 once in the browser. */
export function initAmplitude() {
  if (typeof window === "undefined") return false;
  if (initialized) return true;
  if (initializationAttempted) return false;

  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  if (!apiKey?.trim()) return false;

  initializationAttempted = true;
  try {
    amplitude.init(apiKey, {
      // Route changes are tracked manually with page_path and page_title.
      // Keep the other useful defaults, but don't capture form or click content.
      autocapture: {
        pageViews: false,
        formInteractions: false,
        elementInteractions: false,
        frustrationInteractions: false,
        networkTracking: false,
        webVitals: false,
        fileDownloads: false,
        sessions: true,
        attribution: true,
      },
    });
    initialized = true;
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("Amplitude initialization notice:", error);
    }
    return false;
  }
}

export function trackAmplitudeEvent(eventName, properties = {}) {
  if (typeof window === "undefined" || !eventName || !initAmplitude()) return;
  try {
    amplitude.track(eventName, properties);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`Amplitude event notice [${eventName}]:`, error);
    }
  }
}

export function identifyAmplitudeUser(userId, traits = {}) {
  if (typeof window === "undefined" || !userId || !initAmplitude()) return;
  try {
    amplitude.setUserId(String(userId));
    const identify = new amplitude.Identify();
    for (const [key, value] of Object.entries(traits)) {
      if (value !== undefined && value !== null) identify.set(key, value);
    }
    if (Object.keys(traits).length) amplitude.identify(identify);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("Amplitude identify notice:", error);
    }
  }
}

export function resetAmplitudeUser() {
  if (typeof window === "undefined" || !initialized) return;
  try {
    amplitude.reset();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("Amplitude reset notice:", error);
    }
  }
}

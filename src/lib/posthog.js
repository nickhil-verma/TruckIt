"use client";

import posthog from "posthog-js";

let initialized = false;

/** Initialize PostHog once in the browser. */
export function initPostHog() {
  if (typeof window === "undefined") return false;
  if (initialized) return true;

  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!token?.trim() || !host?.trim()) return false;

  try {
    posthog.init(token, {
      api_host: host,
      capture_pageview: false,
      capture_pageleave: false,
      autocapture: false,
      disable_session_recording: true,
    });
    initialized = true;
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("PostHog initialization notice:", error);
    }
    return false;
  }
}

export function isPostHogAvailable() {
  return typeof window !== "undefined" && initialized;
}

export function capturePostHogEvent(eventName, properties = {}) {
  if (typeof window === "undefined" || !eventName || !initPostHog()) return;

  try {
    const safeProperties = {};
    for (const [key, value] of Object.entries(properties)) {
      if (value === undefined) continue;
      const normalizedKey = key.toLowerCase();
      if (["password", "secret", "token", "key", "card", "cvv", "upi", "credential"].some((term) => normalizedKey.includes(term))) {
        continue;
      }
      if (["string", "number", "boolean"].includes(typeof value) || value === null) {
        safeProperties[key] = value;
      }
    }
    posthog.capture(eventName, safeProperties);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`PostHog event notice [${eventName}]:`, error);
    }
  }
}

export function identifyPostHogUser(userId, traits = {}) {
  if (typeof window === "undefined" || !userId || !initPostHog()) return;

  try {
    const safeTraits = {};
    if (typeof traits.role === "string") safeTraits.role = traits.role;
    posthog.identify(String(userId), safeTraits);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("PostHog identify notice:", error);
    }
  }
}

export function resetPostHogUser() {
  if (typeof window === "undefined" || !initialized) return;
  try {
    posthog.reset();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("PostHog reset notice:", error);
    }
  }
}

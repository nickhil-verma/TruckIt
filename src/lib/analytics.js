/**
 * Unified Analytics Utility Helper
 * Dispatches analytics events to GA4, Mixpanel, Amplitude, and PostHog.
 * GA4 Measurement ID: G-9H83B3QSWN
 */

import {
  trackEvent as trackMixpanelEvent,
  identifyUser as mixpanelIdentify,
  resetMixpanelUser as mixpanelReset
} from "@/lib/mixpanel";
import {
  trackAmplitudeEvent,
  identifyAmplitudeUser,
  resetAmplitudeUser,
} from "@/lib/amplitude";
import {
  capturePostHogEvent,
  identifyPostHogUser,
  resetPostHogUser,
} from "@/lib/posthog";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-9H83B3QSWN";

/**
 * Tracks a single custom page view in every configured provider.
 */
export const pageview = (url, title = "") => {
  if (typeof window === "undefined") return;
  const properties = { page_path: url, page_title: title };
  if (typeof window !== "undefined" && window.gtag) {
    try {
      window.gtag("event", "page_view", {
        page_path: url,
        page_title: title,
      });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("GA4 pageview notice:", err);
      }
    }
  }
  try { trackMixpanelEvent("page_view", properties); } catch (err) {
    if (process.env.NODE_ENV !== "production") console.debug("Mixpanel pageview notice:", err);
  }
  try { trackAmplitudeEvent("page_view", properties); } catch (err) {
    if (process.env.NODE_ENV !== "production") console.debug("Amplitude pageview notice:", err);
  }
  try { capturePostHogEvent("page_view", properties); } catch (err) {
    if (process.env.NODE_ENV !== "production") console.debug("PostHog pageview notice:", err);
  }
};

/**
 * Tracks business events in every configured provider.
 * Prevents analytics exceptions from breaking application workflows.
 */
export const trackEvent = ({
  action,
  category,
  label,
  value,
  currency,
  transaction_id,
  customParams,
  ...rest
}) => {
  if (typeof window === "undefined" || !action) return;

  const eventPayload = {
    event_category: category,
    category: category,
    event_label: label,
    label: label,
    value: value,
    currency: currency,
    transaction_id: transaction_id,
    ...rest,
    ...(customParams && typeof customParams === "object" ? customParams : {}),
  };

  // 1. Google Analytics 4
  if (window.gtag) {
    try {
      window.gtag("event", action, eventPayload);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("GA4 event notice:", err);
      }
    }
  }

  // 2. Mixpanel
  try {
    trackMixpanelEvent(action, eventPayload);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("Mixpanel event notice:", err);
    }
  }

  try {
    trackAmplitudeEvent(action, eventPayload);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("Amplitude event notice:", err);
    }
  }

  try {
    capturePostHogEvent(action, eventPayload);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("PostHog event notice:", err);
    }
  }
};

/**
 * Synchronizes authenticated user identity across analytics providers.
 */
export const identifyUser = (userId, traits = {}) => {
  if (typeof window === "undefined" || !userId) return;

  // Mixpanel Identify
  try {
    mixpanelIdentify(String(userId), traits);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("Mixpanel identify notice:", err);
    }
  }

  try {
    identifyAmplitudeUser(String(userId), { role: traits.role });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("Amplitude identify notice:", err);
    }
  }

  try {
    identifyPostHogUser(String(userId), { role: traits.role });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("PostHog identify notice:", err);
    }
  }

  // GA4 User ID configuration
  if (window.gtag) {
    try {
      window.gtag("config", GA_MEASUREMENT_ID, {
        user_id: String(userId),
      });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("GA4 user_id notice:", err);
      }
    }
  }
};

/**
 * Resets user identity upon logout across providers.
 */
export const resetUser = () => {
  if (typeof window === "undefined") return;

  try {
    mixpanelReset();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("Mixpanel reset notice:", err);
    }
  }
  try {
    resetAmplitudeUser();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("Amplitude reset notice:", err);
    }
  }
  try {
    resetPostHogUser();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("PostHog reset notice:", err);
    }
  }
  if (window.gtag) {
    try {
      window.gtag("config", GA_MEASUREMENT_ID, { user_id: null });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("GA4 user reset notice:", err);
      }
    }
  }
};

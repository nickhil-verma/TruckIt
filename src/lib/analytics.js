/**
 * Unified Analytics Utility Helper
 * Supports Google Analytics 4 (GA4) and Mixpanel concurrently.
 * GA4 Measurement ID: G-9H83B3QSWN
 */

import {
  trackEvent as trackMixpanelEvent,
  identifyUser as mixpanelIdentify,
  resetMixpanelUser as mixpanelReset
} from "@/lib/mixpanel";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-9H83B3QSWN";

/**
 * Tracks custom page views in GA4 (for client-side routing).
 * Note: Mixpanel page views are managed in MixpanelProvider with route deduplication.
 */
export const pageview = (url) => {
  if (typeof window !== "undefined" && window.gtag) {
    try {
      window.gtag("config", GA_MEASUREMENT_ID, {
        page_path: url,
      });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("GA4 pageview notice:", err);
      }
    }
  }
};

/**
 * Tracks business events simultaneously in GA4 and Mixpanel.
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
};

/**
 * Google Analytics (GA4) Utility Helper
 * Measurement ID: G-9H83B3QSWN
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-9H83B3QSWN";

// Track custom page views (for client-side routing)
export const pageview = (url) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track specific user actions (signups, logins, searches, bookings, payments)
export const trackEvent = ({ action, category, label, value, ...customParams }) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
      ...customParams,
    });
  }
};

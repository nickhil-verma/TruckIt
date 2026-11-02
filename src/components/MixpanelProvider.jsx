"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { initMixpanel, trackEvent, identifyUser } from "@/lib/mixpanel";

export default function MixpanelProvider({ children }) {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef(null);

  useEffect(() => {
    initMixpanel();

    // Re-sync existing authenticated session if present in client storage
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const uid = user?._id || user?.id;
        if (uid) {
          identifyUser(String(uid), {
            role: user.role || "customer",
          });
        }
      }
    } catch (e) {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    if (!pathname) return;

    // Prevent duplicate page_view calls for the same route
    if (lastTrackedPathRef.current === pathname) {
      return;
    }
    lastTrackedPathRef.current = pathname;

    trackEvent("page_view", {
      page_path: pathname,
    });
  }, [pathname]);

  return <>{children}</>;
}
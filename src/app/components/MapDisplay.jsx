"use client";

import React, { useEffect, useRef } from "react";

/**
 * MapDisplay Component
 * Renders an OpenStreetMap using Leaflet with dynamic routing and markers.
 */
export default function MapDisplay({ pointA, pointB, routeGeometry }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  useEffect(() => {
    // Ensure we are in the browser
    if (typeof window === "undefined") return;

    const initMap = async () => {
      // Dynamically import Leaflet to avoid SSR issues
      const L = (await import("leaflet")).default;

      // Fix default icons for Leaflet in React
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current) return;

      // Initialize map instance if it doesn't exist
      if (!leafletMapRef.current) {
        leafletMapRef.current = L.map(mapRef.current, {
          center: [19.076, 72.877],
          zoom: 5,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(leafletMapRef.current);
      }

      const map = leafletMapRef.current;

      // Clean up previous layers to prevent memory leaks and visual stacking
      try {
        markersRef.current.forEach((m) => {
          if (m && m.remove) m.remove();
        });
      } catch (err) {
        console.error("Error removing markers:", err);
      }
      
      markersRef.current = [];

      try {
        if (polylineRef.current && polylineRef.current.remove) {
          polylineRef.current.remove();
        }
      } catch (err) {
        console.error("Error removing polyline:", err);
      }
      polylineRef.current = null;

      // Custom Marker Icons (CSS-based)
      const orangeIcon = L.divIcon({
        className: "",
        html: `<div style="background:#f97316;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const greenIcon = L.divIcon({
        className: "",
        html: `<div style="background:#22c55e;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const bounds = [];

      // Add Pickup Marker
      if (pointA) {
        const mA = L.marker([pointA.lat, pointA.lon], { icon: orangeIcon })
          .addTo(map)
          .bindPopup("<b>📍 Pickup</b>");
        markersRef.current.push(mA);
        bounds.push([pointA.lat, pointA.lon]);
      }

      // Add Drop Marker
      if (pointB) {
        const mB = L.marker([pointB.lat, pointB.lon], { icon: greenIcon })
          .addTo(map)
          .bindPopup("<b>🏁 Drop</b>");
        markersRef.current.push(mB);
        bounds.push([pointB.lat, pointB.lon]);
      }

      // Draw Route Polyline
      if (routeGeometry && routeGeometry.length > 0) {
        polylineRef.current = L.polyline(routeGeometry, {
          color: "#f97316",
          weight: 4,
          opacity: 0.85,
          dashArray: "8, 4",
        }).addTo(map);
      }

      // Auto-adjust zoom/view based on markers
      if (bounds.length === 2) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 10);
      }
    };

    initMap();
  }, [pointA, pointB, routeGeometry]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-2xl overflow-hidden shadow-inner bg-[#1a1a2e]"
      style={{ minHeight: 420 }}
    />
  );
}
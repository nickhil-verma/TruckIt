"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

/**
 * Normalizes coordinates into [lng, lat] GeoJSON standard format.
 * Handles both {lat, lon}/{lat, lng} objects and [x, y] arrays.
 */
function toLngLat(coord) {
  if (!coord) return null;
  if (Array.isArray(coord)) {
    const [a, b] = coord;
    if (typeof a !== "number" || typeof b !== "number" || isNaN(a) || isNaN(b)) return null;
    // In India/general coords: lat is roughly -90..90, lng is -180..180
    // If passed as [lat, lng] where lat < lng in India (lat: 8..37, lng: 68..98)
    if (a >= -90 && a <= 90 && b >= -180 && b <= 180 && a < 40 && b > 60) {
      return [b, a];
    }
    return [a, b];
  }
  const lat = typeof coord.lat === "number" ? coord.lat : parseFloat(coord.lat);
  const lng = typeof coord.lon === "number"
    ? coord.lon
    : typeof coord.lng === "number"
    ? coord.lng
    : parseFloat(coord.lon || coord.lng);
  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
  return [lng, lat];
}

export default function MapLibreMapComponent({
  pointA,
  pointB,
  viaStopsCoords,
  routeGeometry,
  onMapClick,
  heightClass = "w-full h-full min-h-[450px]"
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const markerARef = useRef(null);
  const markerBRef = useRef(null);
  const viaMarkersRef = useRef([]);
  const routeRequestIdRef = useRef(0);
  const onMapClickRef = useRef(onMapClick);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // 1. Initialize MapLibre instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let map;
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: OPENFREEMAP_STYLE,
        center: [78.9629, 20.5937], // Center of India
        zoom: 4.8,
        attributionControl: false,
      });

      // Standard map navigation controls (zoom in/out, compass)
      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-right");

      // Custom attribution
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: "© OpenStreetMap contributors · OpenFreeMap"
        }),
        "bottom-left"
      );

      const handleReady = () => {
        setMapLoaded(true);
        try {
          map.resize();
        } catch (e) {}
      };

      if (map.isStyleLoaded()) {
        handleReady();
      } else {
        map.once("style.load", handleReady);
        map.once("load", handleReady);
      }

      map.on("error", (e) => {
        if (e && e.error && e.error.message && !e.error.message.includes("404")) {
          console.warn("MapLibre map notice:", e.error.message);
        }
      });

      map.on("click", (e) => {
        if (onMapClickRef.current) {
          onMapClickRef.current(e.lngLat.lat, e.lngLat.lng);
        }
      });

      mapInstanceRef.current = map;
      // Trigger initial resize after container mounts
      setTimeout(() => {
        try {
          map.resize();
        } catch (e) {}
      }, 100);
    } catch (err) {
      console.error("MapLibre initialization error:", err);
      setMapError(true);
    }

    // Resize observer to ensure map responds immediately to layout/sidebar changes
    let resizeObserver;
    if (window.ResizeObserver && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.resize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (map) {
        try {
          map.remove();
        } catch (err) {
          console.warn("MapLibre cleanup warning:", err);
        }
      }
      mapInstanceRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // 2. Helper to create DOM element for custom markers
  const createMarkerElement = (label, bgGradient, shadowColor, borderColor = "#ffffff") => {
    const el = document.createElement("div");
    el.className = "truckit-custom-marker";
    el.style.width = "32px";
    el.style.height = "38px";
    el.style.cursor = "pointer";
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.alignItems = "center";
    el.style.transform = "translate3d(0, 0, 0)";
    el.style.zIndex = "10";

    el.innerHTML = `
      <div style="
        width: 30px;
        height: 30px;
        background: ${bgGradient};
        border: 2.5px solid ${borderColor};
        border-radius: 50%;
        box-shadow: 0 4px 14px ${shadowColor};
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: -0.5px;
      ">
        ${label}
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 7px solid #ea580c;
        margin-top: -2px;
      "></div>
    `;

    return el;
  };

  // 3. Update markers and route geometry whenever points/route change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    // A. Clean up previous markers
    if (markerARef.current) {
      markerARef.current.remove();
      markerARef.current = null;
    }
    if (markerBRef.current) {
      markerBRef.current.remove();
      markerBRef.current = null;
    }
    viaMarkersRef.current.forEach((m) => m.remove());
    viaMarkersRef.current = [];

    const lngLatA = toLngLat(pointA);
    const lngLatB = toLngLat(pointB);

    // B. Place Marker A (Pickup)
    if (lngLatA) {
      const elA = createMarkerElement("A", "linear-gradient(135deg, #f97316, #ea580c)", "rgba(249,115,22,0.6)");
      elA.title = "Pickup (Point A)";
      const markerA = new maplibregl.Marker({ element: elA, anchor: "bottom" })
        .setLngLat(lngLatA)
        .addTo(map);
      markerARef.current = markerA;
    }

    // C. Place Marker B (Destination)
    if (lngLatB) {
      const elB = createMarkerElement("B", "linear-gradient(135deg, #22c55e, #16a34a)", "rgba(22,163,74,0.6)");
      elB.title = "Destination (Point B)";
      const tip = elB.querySelector("div:last-child");
      if (tip) tip.style.borderTopColor = "#16a34a";

      const markerB = new maplibregl.Marker({ element: elB, anchor: "bottom" })
        .setLngLat(lngLatB)
        .addTo(map);
      markerBRef.current = markerB;
    }

    // D. Place Via stops markers
    if (viaStopsCoords && viaStopsCoords.length > 0) {
      viaStopsCoords.forEach((viaCoord, idx) => {
        const lngLatVia = toLngLat(viaCoord);
        if (lngLatVia) {
          const elVia = createMarkerElement(String(idx + 1), "linear-gradient(135deg, #a855f7, #9333ea)", "rgba(147,51,234,0.5)");
          elVia.title = `Stop #${idx + 1}`;
          const tip = elVia.querySelector("div:last-child");
          if (tip) tip.style.borderTopColor = "#9333ea";

          const markerVia = new maplibregl.Marker({ element: elVia, anchor: "bottom" })
            .setLngLat(lngLatVia)
            .addTo(map);
          viaMarkersRef.current.push(markerVia);
        }
      });
    }

    // E. Draw Orange TruckIt Route
    const drawRouteOnMap = (coordinates) => {
      if (!map) return;

      const geojson = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coordinates
        }
      };

      try {
        if (!map.getSource("truckit-route-source")) {
          map.addSource("truckit-route-source", {
            type: "geojson",
            data: geojson
          });
        } else {
          const src = map.getSource("truckit-route-source");
          if (src) src.setData(geojson);
        }

        // Outer glow/casing layer
        if (!map.getLayer("truckit-route-casing")) {
          map.addLayer({
            id: "truckit-route-casing",
            type: "line",
            source: "truckit-route-source",
            layout: {
              "line-join": "round",
              "line-cap": "round"
            },
            paint: {
              "line-color": "#c2410c",
              "line-width": 8,
              "line-opacity": 0.4
            }
          });
        }

        // Vibrant orange main road line
        if (!map.getLayer("truckit-route-line")) {
          map.addLayer({
            id: "truckit-route-line",
            type: "line",
            source: "truckit-route-source",
            layout: {
              "line-join": "round",
              "line-cap": "round"
            },
            paint: {
              "line-color": "#f97316",
              "line-width": 5,
              "line-opacity": 1
            }
          });
        }
      } catch (err) {
        console.warn("Could not add route layers:", err);
      }

      // Auto-fit bounds
      if (coordinates.length > 0) {
        try {
          map.resize();
          const bounds = new maplibregl.LngLatBounds();
          coordinates.forEach((coord) => bounds.extend(coord));
          map.fitBounds(bounds, {
            padding: { top: 70, bottom: 70, left: 70, right: 70 },
            maxZoom: 14,
            duration: 800
          });
        } catch (e) {}
      }
    };

    // Remove route layer if no route exists
    const clearRouteFromMap = () => {
      if (!map) return;
      try {
        if (map.getSource("truckit-route-source")) {
          const emptyGeojson = {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: []
            }
          };
          map.getSource("truckit-route-source").setData(emptyGeojson);
        }
      } catch (e) {}
    };

    // If parent supplied routeGeometry, convert and draw immediately
    if (routeGeometry && routeGeometry.length > 0) {
      const coords = routeGeometry.map(toLngLat).filter(Boolean);
      if (coords.length > 1) {
        drawRouteOnMap(coords);
        return;
      }
    }

    // If both points exist but no routeGeometry yet, fetch from OSRM
    if (lngLatA && lngLatB) {
      const requestId = ++routeRequestIdRef.current;
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lngLatA[0]},${lngLatA[1]};${lngLatB[0]},${lngLatB[1]}?overview=full&geometries=geojson`;

      fetch(osrmUrl)
        .then((res) => res.json())
        .then((data) => {
          if (requestId !== routeRequestIdRef.current) return; // Stale request cancelled
          if (data && data.code === "Ok" && data.routes && data.routes[0]) {
            const osrmCoords = data.routes[0].geometry.coordinates;
            drawRouteOnMap(osrmCoords);
          } else {
            // Straight line fallback if OSRM is unreachable
            drawRouteOnMap([lngLatA, lngLatB]);
          }
        })
        .catch(() => {
          if (requestId !== routeRequestIdRef.current) return;
          // Fallback to direct path between points
          drawRouteOnMap([lngLatA, lngLatB]);
        });
    } else if (lngLatA || lngLatB) {
      clearRouteFromMap();
      const singlePoint = lngLatA || lngLatB;
      map.flyTo({ center: singlePoint, zoom: 11, duration: 800 });
    } else {
      clearRouteFromMap();
    }
  }, [mapLoaded, pointA, pointB, viaStopsCoords, routeGeometry]);

  if (mapError) {
    return (
      <div className={`${heightClass} rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-6 text-center`}>
        <span className="text-3xl mb-2">🗺️</span>
        <h4 className="text-sm font-bold text-gray-800">Map temporarily unavailable</h4>
        <p className="text-xs text-gray-500 mt-1 max-w-xs">
          Route calculation, pricing, and booking flow remain fully operational.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className={`${heightClass} w-full h-full relative overflow-hidden`}
      style={{ position: "relative", zIndex: 1 }}
    />
  );
}

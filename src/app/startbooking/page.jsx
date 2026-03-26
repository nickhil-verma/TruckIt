"use client"
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Geo helpers ──────────────────────────────────────────────────────────────
async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

function haversineDistance(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

async function getRouteDistance(a, b) {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok") throw new Error("Routing failed");
  const route = data.routes[0];
  return {
    distanceKm: route.distance / 1000,
    durationMin: Math.round(route.duration / 60),
    geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TRUCK_TYPES = [
  { id: "mini",   label: "Mini",   sub: "1 Ton · City runs",   baseRate: 12, icon: "🛻", rating: 4.8, color: "#38bdf8" },
  { id: "medium", label: "Medium", sub: "3 Ton · Intercity",   baseRate: 18, icon: "🚚", rating: 4.7, color: "#f97316" },
  { id: "heavy",  label: "Heavy",  sub: "10 Ton · Bulk cargo", baseRate: 28, icon: "🚛", rating: 4.9, color: "#a78bfa" },
];

// ─── Map component (lazy-loads Leaflet) ───────────────────────────────────────
// ─── Map component (2D White Theme) ───────────────────────────────────────
function LeafletMap({ pointA, pointB, routeGeometry }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef([]);

  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return;
      if (!window.L) {
        await new Promise((resolve) => {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);

          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      if (!mapInstanceRef.current && mapRef.current) {
        const L = window.L;
        const map = L.map(mapRef.current, {
          center: [20.5937, 78.9629],
          zoom: 5,
          zoomControl: false,
        });

        // UPDATED: Using CartoDB Positron for a clean, 2D white/light appearance
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          attribution: "©OSM ©Carto",
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);
        mapInstanceRef.current = map;
      }
    };
    loadLeaflet();
  }, []);

  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];

    if (!pointA || !pointB) return;

    // Adjusted icons for better contrast on a white map
    const iconA = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;background:#f97316;border:2px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,0.2)"></div>`,
      iconAnchor: [7, 7],
    });
    const iconB = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;background:#16a34a;border:2px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,0.2)"></div>`,
      iconAnchor: [7, 7],
    });

    const mA = L.marker([pointA.lat, pointA.lon], { icon: iconA }).addTo(map);
    const mB = L.marker([pointB.lat, pointB.lon], { icon: iconB }).addTo(map);
    layersRef.current.push(mA, mB);

    if (routeGeometry) {
      const polyline = L.polyline(routeGeometry, {
        color: "#f97316", // Keeping the brand orange for the route
        weight: 5,
        opacity: 0.8,
      }).addTo(map);
      layersRef.current.push(polyline);
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    } else {
      map.fitBounds(
        L.latLngBounds([pointA.lat, pointA.lon], [pointB.lat, pointB.lon]),
        { padding: [60, 60] }
      );
    }
  }, [pointA, pointB, routeGeometry]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "16px",
        overflow: "hidden",
        background: "#f8f9fa", // Light background while loading
      }}
    />
  );
}

// ─── Truck Card ───────────────────────────────────────────────────────────────
function TruckCard({ truck, selected, onSelect, price }) {
  const isSelected = selected === truck.id;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(truck.id)}
      style={{
        cursor: "pointer",
        borderRadius: "14px",
        padding: "14px 16px",
        background: isSelected
          ? `linear-gradient(135deg, ${truck.color}22, ${truck.color}10)`
          : "rgba(255,255,255,0.04)",
        border: `1.5px solid ${isSelected ? truck.color : "rgba(255,255,255,0.09)"}`,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        transition: "border-color 0.2s, background 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isSelected && (
        <motion.div
          layoutId="truckGlow"
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 20% 50%, ${truck.color}18, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      )}
      <div style={{ fontSize: "28px", lineHeight: 1 }}>{truck.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: "15px", color: "#f1f5f9", fontFamily: "Syne, sans-serif" }}>
          {truck.label}
        </div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>{truck.sub}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: 700, fontSize: "15px", color: isSelected ? truck.color : "#f1f5f9" }}>
          {price != null ? `₹${price.toLocaleString()}` : `₹${truck.baseRate}/km`}
        </div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
          ⭐ {truck.rating}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────
function RouteInput({ label, value, onChange, dotColor, placeholder }) {
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: "14px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: dotColor,
          boxShadow: `0 0 8px ${dotColor}`,
          zIndex: 1,
        }}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.06)",
          border: "1.5px solid rgba(255,255,255,0.1)",
          borderRadius: "10px",
          padding: "12px 14px 12px 34px",
          color: "#f1f5f9",
          fontSize: "14px",
          fontFamily: "DM Sans, sans-serif",
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = dotColor)}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function TruckItApp() {
  const [from, setFrom] = useState("Mumbai");
  const [to, setTo] = useState("Bengaluru");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coordA, setCoordA] = useState(null);
  const [coordB, setCoordB] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationMin, setDurationMin] = useState(null);
  const [selectedTruck, setSelectedTruck] = useState("medium");
  const [booked, setBooked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const selectedTruckData = TRUCK_TYPES.find((t) => t.id === selectedTruck) ?? TRUCK_TYPES[1];
  const totalPrice = distanceKm ? Math.round(distanceKm * selectedTruckData.baseRate) : null;

  const formatDuration = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleSearch = useCallback(async () => {
    if (!from.trim() || !to.trim()) return;
    setLoading(true);
    setError("");
    setDistanceKm(null);
    setDurationMin(null);
    setRouteGeometry(null);
    setCoordA(null);
    setCoordB(null);
    setBooked(false);

    try {
      const [a, b] = await Promise.all([geocode(from), geocode(to)]);
      if (!a) throw new Error(`Could not find: "${from}"`);
      if (!b) throw new Error(`Could not find: "${to}"`);
      setCoordA(a);
      setCoordB(b);
      try {
        const route = await getRouteDistance(a, b);
        setDistanceKm(route.distanceKm);
        setDurationMin(route.durationMin);
        setRouteGeometry(route.geometry);
      } catch {
        const d = haversineDistance(a, b);
        setDistanceKm(d);
        setDurationMin(Math.round((d / 60) * 60));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0d14; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(249,115,22,0.4); border-radius: 4px; }
        input::placeholder { color: rgba(255,255,255,0.3) !important; }
        .leaflet-control-zoom a {
          background: rgba(15,18,28,0.95) !important;
          color: #f1f5f9 !important;
          border-color: rgba(255,255,255,0.15) !important;
        }
        .leaflet-control-zoom a:hover { background: rgba(249,115,22,0.2) !important; }
        .leaflet-control-attribution { display: none !important; }
      `}</style>

      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background: "#0a0d14",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          color: "#f1f5f9",
        }}
      >
        {/* ── Header ── */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            background: "rgba(10,13,20,0.95)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 999,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #f97316, #c2410c)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                boxShadow: "0 0 20px rgba(249,115,22,0.4)",
              }}
            >
              🚛
            </div>
            <span
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 900,
                fontSize: "22px",
                letterSpacing: "-0.5px",
              }}
            >
              TRUCK<span style={{ color: "#f97316" }}>IT</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "20px",
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.25)",
                fontSize: "12px",
                fontWeight: 600,
                color: "#4ade80",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  animation: "pulse 2s infinite",
                  display: "inline-block",
                }}
              />
              LIVE
            </div>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f97316, #7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              RK
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 61px)" }}>

          {/* ── Sidebar ── */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                  width: "340px",
                  minWidth: "340px",
                  background: "rgba(13,16,25,0.97)",
                  borderRight: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  flexDirection: "column",
                  overflowY: "auto",
                  overflowX: "hidden",
                  backdropFilter: "blur(16px)",
                }}
              >
                {/* Route inputs */}
                <div style={{ padding: "20px 20px 0" }}>
                  <p
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontWeight: 800,
                      fontSize: "18px",
                      marginBottom: "16px",
                      letterSpacing: "-0.3px",
                    }}
                  >
                    Book a Truck
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* Connector line */}
                    <div style={{ position: "relative" }}>
                      <div
                        style={{
                          position: "absolute",
                          left: "19px",
                          top: "100%",
                          width: "2px",
                          height: "10px",
                          background: "rgba(255,255,255,0.12)",
                          zIndex: 2,
                        }}
                      />
                    </div>
                    <RouteInput
                      label="Pickup"
                      value={from}
                      onChange={setFrom}
                      dotColor="#f97316"
                      placeholder="Pickup location"
                    />
                    <RouteInput
                      label="Drop"
                      value={to}
                      onChange={setTo}
                      dotColor="#22c55e"
                      placeholder="Drop location"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSearch}
                    disabled={loading}
                    style={{
                      width: "100%",
                      marginTop: "14px",
                      padding: "13px",
                      borderRadius: "12px",
                      border: "none",
                      background: loading
                        ? "rgba(249,115,22,0.4)"
                        : "linear-gradient(135deg, #f97316, #c2410c)",
                      color: "white",
                      fontFamily: "Syne, sans-serif",
                      fontWeight: 700,
                      fontSize: "14px",
                      letterSpacing: "0.5px",
                      cursor: loading ? "not-allowed" : "pointer",
                      boxShadow: loading ? "none" : "0 4px 20px rgba(249,115,22,0.35)",
                      transition: "all 0.2s",
                    }}
                  >
                    {loading ? "Finding route…" : "🔍  Search Route"}
                  </motion.button>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                          marginTop: "10px",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          background: "rgba(239,68,68,0.12)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          color: "#fca5a5",
                          fontSize: "13px",
                        }}
                      >
                        ⚠️ {error}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Route stats */}
                <AnimatePresence>
                  {distanceKm !== null && !loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ padding: "16px 20px 0" }}
                    >
                      <div
                        style={{
                          borderRadius: "14px",
                          padding: "14px 16px",
                          background: "rgba(249,115,22,0.07)",
                          border: "1px solid rgba(249,115,22,0.18)",
                          display: "flex",
                          justifyContent: "space-around",
                          gap: "8px",
                        }}
                      >
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "20px", fontWeight: 700, color: "#fb923c", fontFamily: "Syne, sans-serif" }}>
                            {distanceKm.toFixed(0)} km
                          </div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Distance</div>
                        </div>
                        <div style={{ width: "1px", background: "rgba(255,255,255,0.08)" }} />
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "20px", fontWeight: 700, color: "#38bdf8", fontFamily: "Syne, sans-serif" }}>
                            {durationMin != null ? formatDuration(durationMin) : "—"}
                          </div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Est. Time</div>
                        </div>
                        <div style={{ width: "1px", background: "rgba(255,255,255,0.08)" }} />
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "20px", fontWeight: 700, color: "#a78bfa", fontFamily: "Syne, sans-serif" }}>
                            ₹{totalPrice?.toLocaleString() ?? "—"}
                          </div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Est. Fare</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Divider */}
                <div style={{ margin: "18px 20px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }} />

                {/* Truck types */}
                <div style={{ padding: "16px 20px 0" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "1px", marginBottom: "12px", textTransform: "uppercase" }}>
                    Select Vehicle
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {TRUCK_TYPES.map((truck) => (
                      <TruckCard
                        key={truck.id}
                        truck={truck}
                        selected={selectedTruck}
                        onSelect={setSelectedTruck}
                        price={distanceKm ? Math.round(distanceKm * truck.baseRate) : null}
                      />
                    ))}
                  </div>
                </div>

                {/* Booking */}
                <div style={{ padding: "18px 20px 24px", marginTop: "auto" }}>
                  <AnimatePresence mode="wait">
                    {!booked ? (
                      <motion.button
                        key="book"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ scale: distanceKm ? 1.02 : 1 }}
                        whileTap={{ scale: distanceKm ? 0.97 : 1 }}
                        onClick={() => distanceKm && setBooked(true)}
                        style={{
                          width: "100%",
                          padding: "15px",
                          borderRadius: "14px",
                          border: "none",
                          background: distanceKm
                            ? `linear-gradient(135deg, ${selectedTruckData.color}, ${selectedTruckData.color}99)`
                            : "rgba(255,255,255,0.06)",
                          color: distanceKm ? "white" : "rgba(255,255,255,0.3)",
                          fontFamily: "Syne, sans-serif",
                          fontWeight: 800,
                          fontSize: "15px",
                          cursor: distanceKm ? "pointer" : "not-allowed",
                          boxShadow: distanceKm ? `0 4px 24px ${selectedTruckData.color}44` : "none",
                          transition: "all 0.25s",
                          letterSpacing: "0.3px",
                        }}
                      >
                        {distanceKm
                          ? `Book ${selectedTruckData.icon} ${selectedTruckData.label} · ₹${totalPrice?.toLocaleString()}`
                          : "Search a route first"}
                      </motion.button>
                    ) : (
                      <motion.div
                        key="confirmed"
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.85, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        style={{
                          borderRadius: "14px",
                          padding: "18px",
                          background: "rgba(34,197,94,0.1)",
                          border: "1.5px solid rgba(34,197,94,0.35)",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
                        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "16px", color: "#4ade80", marginBottom: "4px" }}>
                          Booking Confirmed!
                        </div>
                        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                          {selectedTruckData.icon} {selectedTruckData.label} · {from} → {to}
                        </div>
                        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
                          ₹{totalPrice?.toLocaleString()} · {durationMin ? formatDuration(durationMin) : ""}
                        </div>
                        <button
                          onClick={() => setBooked(false)}
                          style={{
                            marginTop: "12px",
                            padding: "8px 18px",
                            borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.15)",
                            background: "transparent",
                            color: "rgba(255,255,255,0.5)",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          New Booking
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ── Map area ── */}
          <div style={{ flex: 1, position: "relative", padding: "12px" }}>
            {/* Toggle sidebar button */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              style={{
                position: "absolute",
                top: "50%",
                left: sidebarOpen ? "-1px" : "12px",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: "28px",
                height: "56px",
                borderRadius: sidebarOpen ? "0 8px 8px 0" : "8px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(13,16,25,0.95)",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                backdropFilter: "blur(8px)",
                transition: "left 0.3s",
              }}
            >
              {sidebarOpen ? "◂" : "▸"}
            </button>

            {/* Map */}
            <div style={{ width: "100%", height: "100%", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
              <LeafletMap pointA={coordA} pointB={coordB} routeGeometry={routeGeometry} />
            </div>

            {/* Route pill overlay */}
            <AnimatePresence>
              {distanceKm !== null && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  style={{
                    position: "absolute",
                    bottom: "24px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(10,13,20,0.92)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(14px)",
                    borderRadius: "40px",
                    padding: "10px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                    zIndex: 5,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f97316", display: "inline-block", boxShadow: "0 0 6px #f97316" }} />
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>{from}</span>
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "18px" }}>·····</span>
                  <span style={{ fontWeight: 700, color: "#fb923c", fontFamily: "Syne, sans-serif" }}>{distanceKm.toFixed(0)} km</span>
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "18px" }}>·····</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>{to}</span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading overlay */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: "absolute",
                    inset: "12px",
                    borderRadius: "16px",
                    background: "rgba(10,13,20,0.65)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "14px",
                    zIndex: 6,
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      border: "3px solid rgba(249,115,22,0.2)",
                      borderTop: "3px solid #f97316",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>Finding best route…</span>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
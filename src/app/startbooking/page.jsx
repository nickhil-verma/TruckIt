"use client"
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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
  { id: "mini",   label: "Mini",   sub: "1 Ton · City runs",   baseRate: 12, icon: "🛻", rating: 4.8, color: "#0ea5e9" },
  { id: "medium", label: "Medium", sub: "3 Ton · Intercity",   baseRate: 18, icon: "🚚", rating: 4.7, color: "#f97316" },
  { id: "heavy",  label: "Heavy",  sub: "10 Ton · Bulk cargo", baseRate: 28, icon: "🚛", rating: 4.9, color: "#8b5cf6" },
];

// ─── Map component ────────────────────────────────────────────────────────────
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

    const iconA = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;background:#f97316;border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(249,115,22,0.4)"></div>`,
      iconAnchor: [7, 7],
    });
    const iconB = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;background:#16a34a;border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(22,163,74,0.4)"></div>`,
      iconAnchor: [7, 7],
    });

    const mA = L.marker([pointA.lat, pointA.lon], { icon: iconA }).addTo(map);
    const mB = L.marker([pointB.lat, pointB.lon], { icon: iconB }).addTo(map);
    layersRef.current.push(mA, mB);

    if (routeGeometry && routeGeometry.length > 0) {
      const polyline = L.polyline(routeGeometry, {
        color: "#f97316",
        weight: 5,
        opacity: 0.85,
      }).addTo(map);
      layersRef.current.push(polyline);
      const bounds = polyline.getBounds();
      if (bounds.isValid()) {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
      const bounds = L.latLngBounds([pointA.lat, pointA.lon], [pointB.lat, pointB.lon]);
      if (bounds.isValid()) {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [60, 60] });
      }
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
        background: "#f1f5f9",
      }}
    />
  );
}

// ─── Truck Card ───────────────────────────────────────────────────────────────
function TruckCard({ truck, selected, onSelect, price }) {
  const isSelected = selected === truck.id;
  return (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => onSelect(truck.id)}
      style={{
        cursor: "pointer",
        borderRadius: "12px",
        padding: "13px 15px",
        background: isSelected ? `${truck.color}0d` : "#fff",
        border: `1.5px solid ${isSelected ? truck.color : "#e5e7eb"}`,
        display: "flex",
        alignItems: "center",
        gap: "11px",
        transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
        boxShadow: isSelected ? `0 2px 12px ${truck.color}22` : "0 1px 3px rgba(0,0,0,0.04)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ fontSize: "26px", lineHeight: 1 }}>{truck.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>{truck.label}</div>
        <div style={{ fontSize: "11.5px", color: "#9ca3af", marginTop: "1px" }}>{truck.sub}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: 700, fontSize: "14px", color: isSelected ? truck.color : "#374151" }}>
          {price != null ? `₹${price.toLocaleString()}` : `₹${truck.baseRate}/km`}
        </div>
        <div style={{ fontSize: "11px", color: "#d1d5db", marginTop: "1px" }}>⭐ {truck.rating}</div>
      </div>
    </motion.div>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────
function RouteInput({ value, onChange, dotColor, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: "13px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "9px",
          height: "9px",
          borderRadius: "50%",
          background: dotColor,
          boxShadow: focused ? `0 0 0 3px ${dotColor}25` : "none",
          zIndex: 1,
          transition: "box-shadow 0.2s",
        }}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: focused ? "#fff" : "#f9fafb",
          border: `1.5px solid ${focused ? dotColor : "#e5e7eb"}`,
          borderRadius: "10px",
          padding: "11px 13px 11px 31px",
          color: "#111827",
          fontSize: "13.5px",
          outline: "none",
          transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
          boxShadow: focused ? `0 0 0 3px ${dotColor}14` : "none",
        }}
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
  const [bookingLoading, setBookingLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Empty routes logic
  const [bookingMode, setBookingMode] = useState("fresh"); // "fresh", "empty"
  const [emptyRoutes, setEmptyRoutes] = useState([]);
  
  const router = useRouter();

  useEffect(() => {
    if (bookingMode === "empty") {
      fetch("/api/route-posts")
        .then(res => res.json())
        .then(data => setEmptyRoutes(data.routes || []));
    }
  }, [bookingMode]);

  const selectedTruckData = TRUCK_TYPES.find((t) => t.id === selectedTruck) ?? TRUCK_TYPES[1];
  const baseTotal = distanceKm ? Math.round(distanceKm * selectedTruckData.baseRate) : null;
  const totalPrice = bookingMode === "empty" && baseTotal ? Math.round(baseTotal * 0.6) : baseTotal; // 40% discount for empty return

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

  const handleBook = async () => {
    if (!distanceKm) return;
    
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please sign in to book a truck");
      router.push("/login");
      return;
    }

    setBookingLoading(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          pickup: from,
          dropoff: to,
          truckType: selectedTruckData.label,
          price: totalPrice,
          distance: distanceKm
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to book");
      }

      setBooked(true);
      toast.success("Truck booked successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        input::placeholder { color: #9ca3af !important; }
        .leaflet-control-zoom a {
          background: #fff !important;
          color: #374151 !important;
          border-color: #e5e7eb !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08) !important;
        }
        .leaflet-control-zoom a:hover { background: #f9fafb !important; color: #f97316 !important; }
        .leaflet-control-attribution { display: none !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }
      `}} />

      <div className="bg-slate-50 h-screen overflow-hidden flex flex-col font-sans text-gray-900">
        <Navbar />

        {/* ── Body ── */}
        <div className="pt-[72px] flex flex-1 overflow-hidden relative">

          {/* ── Sidebar ── */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside
                initial={{ x: -340, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -340, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 32 }}
                className="absolute md:relative z-20 h-[calc(100vh-72px)] md:h-full w-full max-w-[336px] flex flex-col"
                style={{
                  background: "#ffffff",
                  borderRight: "1px solid #f1f5f9",
                  overflowY: "auto",
                  overflowX: "hidden",
                  boxShadow: "2px 0 12px rgba(0,0,0,0.04)",
                }}
              >
                {/* ── Book section ── */}
                <div style={{ padding: "20px 18px 0" }}>
                  <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "10px", padding: "4px", marginBottom: "16px" }}>
                    <button 
                      onClick={() => setBookingMode("fresh")}
                      style={{ flex: 1, padding: "8px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, background: bookingMode === "fresh" ? "#fff" : "transparent", color: bookingMode === "fresh" ? "#111827" : "#64748b", boxShadow: bookingMode === "fresh" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", border: "none", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      Book Fresh
                    </button>
                    <button 
                      onClick={() => setBookingMode("empty")}
                      style={{ flex: 1, padding: "8px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, background: bookingMode === "empty" ? "#fff" : "transparent", color: bookingMode === "empty" ? "#15803d" : "#64748b", boxShadow: bookingMode === "empty" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", border: "none", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      Empty Return %
                    </button>
                  </div>

                  <p style={{ fontWeight: 700, fontSize: "17px", marginBottom: "14px", color: "#111827", letterSpacing: "-0.3px" }}>
                    {bookingMode === "fresh" ? "Book a Truck" : "Find Discounted Trucks"}
                  </p>

                  {/* Inputs with connector */}
                  <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {/* Dashed connector */}
                    <div style={{
                      position: "absolute",
                      left: "17px",
                      top: "36px",
                      width: "1.5px",
                      height: "18px",
                      background: "repeating-linear-gradient(to bottom, #d1d5db 0px, #d1d5db 4px, transparent 4px, transparent 8px)",
                      zIndex: 2,
                    }} />
                    <RouteInput value={from} onChange={setFrom} dotColor="#f97316" placeholder="Pickup location" />
                    <RouteInput value={to} onChange={setTo} dotColor="#22c55e" placeholder="Drop location" />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.975 }}
                    onClick={handleSearch}
                    disabled={loading}
                    style={{
                      width: "100%",
                      marginTop: "12px",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "none",
                      background: loading ? "#fed7aa" : "linear-gradient(135deg, #f97316, #ea580c)",
                      color: loading ? "#9a3412" : "white",
                      fontWeight: 600,
                      fontSize: "13.5px",
                      cursor: loading ? "not-allowed" : "pointer",
                      boxShadow: loading ? "none" : "0 3px 14px rgba(249,115,22,0.3)",
                      transition: "all 0.2s",
                      letterSpacing: "0.1px",
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
                          marginTop: "9px",
                          padding: "9px 13px",
                          borderRadius: "9px",
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          color: "#dc2626",
                          fontSize: "12.5px",
                        }}
                      >
                        ⚠️ {error}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Route stats ── */}
                <AnimatePresence>
                  {distanceKm !== null && !loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ padding: "14px 18px 0" }}
                    >
                      <div
                        style={{
                          borderRadius: "12px",
                          padding: "13px 14px",
                          background: "#fff7ed",
                          border: "1px solid #fed7aa",
                          display: "flex",
                          justifyContent: "space-around",
                          gap: "8px",
                        }}
                      >
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "18px", fontWeight: 700, color: "#ea580c" }}>
                            {distanceKm.toFixed(0)} km
                          </div>
                          <div style={{ fontSize: "10.5px", color: "#9ca3af", marginTop: "2px" }}>Distance</div>
                        </div>
                        <div style={{ width: "1px", background: "#fed7aa" }} />
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "18px", fontWeight: 700, color: "#0284c7" }}>
                            {durationMin != null ? formatDuration(durationMin) : "—"}
                          </div>
                          <div style={{ fontSize: "10.5px", color: "#9ca3af", marginTop: "2px" }}>Est. Time</div>
                        </div>
                        <div style={{ width: "1px", background: "#fed7aa" }} />
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "18px", fontWeight: 700, color: bookingMode === "empty" ? "#15803d" : "#7c3aed" }}>
                            ₹{totalPrice?.toLocaleString() ?? "—"}
                          </div>
                          <div style={{ fontSize: "10.5px", color: "#9ca3af", marginTop: "2px" }}>{bookingMode === "empty" ? "Discounted Fare" : "Est. Fare"}</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Divider */}
                <div style={{ margin: "16px 18px 0", borderTop: "1px solid #f1f5f9" }} />

                {/* ── Vehicle / Route selector ── */}
                <div style={{ padding: "14px 18px 0" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.8px", marginBottom: "10px", textTransform: "uppercase" }}>
                    {bookingMode === "fresh" ? "Select Vehicle" : "Available Empty Trucks"}
                  </p>
                  
                  {bookingMode === "empty" && emptyRoutes.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "#9ca3af", fontSize: "13px", background: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                      No empty return trucks available right now.
                    </div>
                  ) : bookingMode === "empty" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                      {emptyRoutes.map((route) => {
                        const truckTypeObj = TRUCK_TYPES.find(t => t.id === route.truckType) || TRUCK_TYPES[1];
                        return (
                          <div
                            key={route._id}
                            onClick={() => {
                              setFrom(route.origin);
                              setTo(route.destination);
                              setSelectedTruck(route.truckType);
                              setTimeout(() => handleSearch(), 100);
                            }}
                            style={{
                              cursor: "pointer", borderRadius: "12px", padding: "13px 15px", background: "#f0fdf4", border: "1.5px solid #bbf7d0", display: "flex", alignItems: "center", gap: "11px"
                            }}
                          >
                            <div style={{ fontSize: "24px" }}>{truckTypeObj.icon}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: "13px", color: "#166534" }}>{route.origin} → {route.destination}</div>
                              <div style={{ fontSize: "11px", color: "#15803d", marginTop: "2px" }}>Date: {route.date}</div>
                            </div>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "4px 8px", borderRadius: "20px" }}>40% OFF</div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                      {TRUCK_TYPES.map((truck) => (
                        <TruckCard
                          key={truck.id}
                          truck={truck}
                          selected={selectedTruck}
                          onSelect={setSelectedTruck}
                          price={distanceKm ? (bookingMode === "empty" ? Math.round(distanceKm * truck.baseRate * 0.6) : Math.round(distanceKm * truck.baseRate)) : null}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Book button ── */}
                <div style={{ padding: "16px 18px 22px", marginTop: "auto" }}>
                  <AnimatePresence mode="wait">
                    {!booked ? (
                      <motion.button
                        key="book"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        whileHover={{ scale: distanceKm ? 1.015 : 1 }}
                        whileTap={{ scale: distanceKm ? 0.975 : 1 }}
                        onClick={handleBook}
                        disabled={bookingLoading}
                        style={{
                          width: "100%",
                          padding: "14px",
                          borderRadius: "12px",
                          border: "none",
                          background: distanceKm
                            ? selectedTruckData.color
                            : "#f3f4f6",
                          color: distanceKm ? "white" : "#9ca3af",
                          fontWeight: 700,
                          fontSize: "14px",
                          cursor: distanceKm ? "pointer" : "not-allowed",
                          boxShadow: distanceKm ? `0 4px 18px ${selectedTruckData.color}40` : "none",
                          transition: "all 0.25s",
                          opacity: bookingLoading ? 0.7 : 1,
                        }}
                      >
                        {bookingLoading ? "Booking..." : (distanceKm
                          ? `Book ${selectedTruckData.icon} ${selectedTruckData.label} · ₹${totalPrice?.toLocaleString()}`
                          : "Search a route first")}
                      </motion.button>
                    ) : (
                      <motion.div
                        key="confirmed"
                        initial={{ scale: 0.88, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.88, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 26 }}
                        style={{
                          borderRadius: "12px",
                          padding: "16px",
                          background: "#f0fdf4",
                          border: "1.5px solid #bbf7d0",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "28px", marginBottom: "6px" }}>✅</div>
                        <div style={{ fontWeight: 700, fontSize: "15px", color: "#15803d", marginBottom: "4px" }}>
                          Booking Confirmed!
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#6b7280" }}>
                          {selectedTruckData.icon} {selectedTruckData.label} · {from} → {to}
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#6b7280", marginTop: "2px" }}>
                          ₹{totalPrice?.toLocaleString()} · {durationMin ? formatDuration(durationMin) : ""}
                        </div>
                        <button
                          onClick={() => setBooked(false)}
                          style={{
                            marginTop: "10px",
                            padding: "7px 16px",
                            borderRadius: "8px",
                            border: "1px solid #d1fae5",
                            background: "#fff",
                            color: "#15803d",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: "pointer",
                            transition: "background 0.15s",
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

            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className={`absolute top-1/2 -translate-y-1/2 z-30 w-6 h-13 border border-gray-200 bg-white text-gray-400 cursor-pointer flex items-center justify-center text-xs shadow-md transition-all duration-300 ${sidebarOpen ? 'left-[335px] md:-left-[1px] rounded-r-lg' : 'left-3 rounded-lg'}`}
            >
              {sidebarOpen ? "◂" : "▸"}
            </button>

            {/* Map */}
            <div style={{ width: "100%", height: "100%", borderRadius: "16px", overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              <LeafletMap pointA={coordA} pointB={coordB} routeGeometry={routeGeometry} />
            </div>

            {/* Route pill */}
            <AnimatePresence>
              {distanceKm !== null && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: "absolute",
                    bottom: "24px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(255,255,255,0.96)",
                    border: "1px solid #e5e7eb",
                    backdropFilter: "blur(12px)",
                    borderRadius: "40px",
                    padding: "9px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                    zIndex: 5,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f97316", display: "inline-block" }} />
                    <span style={{ color: "#374151", fontWeight: 500 }}>{from}</span>
                  </span>
                  <span style={{ color: "#d1d5db", fontSize: "16px" }}>·····</span>
                  <span style={{ fontWeight: 700, color: "#f97316" }}>{distanceKm.toFixed(0)} km</span>
                  <span style={{ color: "#d1d5db", fontSize: "16px" }}>·····</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                    <span style={{ color: "#374151", fontWeight: 500 }}>{to}</span>
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
                    background: "rgba(248,250,252,0.75)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    zIndex: 6,
                  }}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid #fed7aa", borderTop: "3px solid #f97316", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ color: "#6b7280", fontSize: "13.5px", fontWeight: 500 }}>Finding best route…</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
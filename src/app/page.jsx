"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Truck } from "lucide-react";
import MapDisplay from "@/components/MapDisplay";
import TruckSidebar from "@/components/TruckSidebar";

interface Coordinates {
  lat: number;
  lon: number;
}

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
}

async function geocode(query: string): Promise<Coordinates | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  const data: LocationResult[] = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

function haversineDistance(a: Coordinates, b: Coordinates): number {
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

async function getRouteDistance(
  a: Coordinates,
  b: Coordinates
): Promise<{ distanceKm: number; durationMin: number; geometry: [number, number][] }> {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok") throw new Error("OSRM routing failed");
  const route = data.routes[0];
  return {
    distanceKm: route.distance / 1000,
    durationMin: Math.round(route.duration / 60),
    geometry: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
  };
}

const TRUCK_TYPES = [
  { id: "mini", label: "Mini Truck", capacity: "1 Ton", baseRate: 12, icon: "🛻", eta: "45 min", rating: 4.8 },
  { id: "medium", label: "Medium Truck", capacity: "3 Ton", baseRate: 18, icon: "🚚", eta: "30 min", rating: 4.7 },
  { id: "heavy", label: "Heavy Truck", capacity: "10 Ton", baseRate: 28, icon: "🚛", eta: "20 min", rating: 4.9 },
];

export default function TruckItPage() {
  const [from, setFrom] = useState("Mumbai");
  const [to, setTo] = useState("Bengaluru");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coordA, setCoordA] = useState<Coordinates | null>(null);
  const [coordB, setCoordB] = useState<Coordinates | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [selectedTruck, setSelectedTruck] = useState("medium");
  const [booked, setBooked] = useState(false);

  const selectedTruckData = TRUCK_TYPES.find((t) => t.id === selectedTruck) ?? TRUCK_TYPES[1];
  const totalPrice = distanceKm ? Math.round(distanceKm * selectedTruckData.baseRate) : null;

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
      if (!a) throw new Error(`Could not find location: "${from}"`);
      if (!b) throw new Error(`Could not find location: "${to}"`);
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div
        className="min-h-screen text-white"
        style={{
          background: "linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
          * { box-sizing: border-box; }
          .truck-card:hover { transform: translateY(-2px); transition: all 0.2s ease; }
          .glow-orange { box-shadow: 0 0 24px rgba(249,115,22,0.35); }
          .input-dark { background: rgba(255,255,255,0.07) !important; border: 1px solid rgba(255,255,255,0.12) !important; color: white !important; }
          .input-dark::placeholder { color: rgba(255,255,255,0.35) !important; }
          .input-dark:focus { border-color: #f97316 !important; box-shadow: 0 0 0 2px rgba(249,115,22,0.2) !important; }
          .leaflet-container { background: #1a1a2e; }
        `}</style>

        <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center glow-orange" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.5px" }}>
              TRUCK<span style={{ color: "#f97316" }}>IT</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="px-3 py-1 text-xs font-semibold" style={{ background: "rgba(249,115,22,0.15)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.3)" }}>🟢 LIVE</Badge>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "rgba(255,255,255,0.1)" }}>RK</div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
          <TruckSidebar
            from={from}
            to={to}
            setFrom={setFrom}
            setTo={setTo}
            handleSearch={handleSearch}
            loading={loading}
            error={error}
            distanceKm={distanceKm}
            durationMin={durationMin}
            formatDuration={formatDuration}
            TRUCK_TYPES={TRUCK_TYPES}
            selectedTruck={selectedTruck}
            setSelectedTruck={setSelectedTruck}
            booked={booked}
            setBooked={setBooked}
            selectedTruckData={selectedTruckData}
            totalPrice={totalPrice}
          />

          <div className="flex-1 relative p-4">
            <div className="absolute top-7 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2" style={{ background: "rgba(15,12,41,0.85)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.7)" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#f97316" }} />
              OpenStreetMap · OSRM Routing
            </div>

            <MapDisplay pointA={coordA} pointB={coordB} routeGeometry={routeGeometry} />

            {distanceKm !== null && !loading && (
              <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex gap-4 px-5 py-3 rounded-2xl text-sm" style={{ background: "rgba(15,12,41,0.9)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", whiteSpace: "nowrap" }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#f97316" }} />
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>{from}</span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>━━</span>
                <span className="font-bold" style={{ color: "#fb923c" }}>{distanceKm.toFixed(0)} km</span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>━━</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>{to}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { LayoutDashboard, Search, Truck, CheckCircle, MessageSquare, Settings, CreditCard, Check, CheckCheck, MapPin, PlusCircle, Star, Trash2 } from "lucide-react";

// Geo helpers for driver route posting
async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  try {
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// Leaflet Map Wrapper for Driver Return Route Preview
function LeafletMap({ pointA, pointB, viaStopsCoords, routeGeometry }) {
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
    const iconVia = L.divIcon({
      className: "",
      html: `<div style="width:10px;height:10px;background:#8b5cf6;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(139,92,246,0.4)"></div>`,
      iconAnchor: [5, 5],
    });

    const mA = L.marker([pointA.lat, pointA.lon], { icon: iconA }).addTo(map);
    const mB = L.marker([pointB.lat, pointB.lon], { icon: iconB }).addTo(map);
    layersRef.current.push(mA, mB);

    if (viaStopsCoords && viaStopsCoords.length > 0) {
      viaStopsCoords.forEach(coord => {
        const marker = L.marker([coord.lat, coord.lon], { icon: iconVia }).addTo(map);
        layersRef.current.push(marker);
      });
    }

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
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    } else {
      const bounds = L.latLngBounds([pointA.lat, pointA.lon], [pointB.lat, pointB.lon]);
      if (bounds.isValid()) {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [pointA, pointB, viaStopsCoords, routeGeometry]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[320px] md:h-full min-h-[300px] rounded-3xl overflow-hidden shadow-inner border border-slate-100"
      style={{ position: "relative", zIndex: 1 }}
    />
  );
}

export default function DriverDashboard() {
  const [trips, setTrips] = useState([]);
  const [pendingTrips, setPendingTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "find-loads", "active", "past", "chat", "settings"
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  // Chat specific state
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [chatSortBy, setChatSortBy] = useState("date"); // "date" or "name"
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const messagesEndRef = useRef(null);

  // User state
  const [user, setUser] = useState(null);
  const [postedRoutes, setPostedRoutes] = useState([]);
  
  // Geocoding and routing states for driver route posts
  const [driverFrom, setDriverFrom] = useState("Pune");
  const [driverTo, setDriverTo] = useState("Mumbai");
  const [driverStops, setDriverStops] = useState([]);
  const [driverCoordA, setDriverCoordA] = useState(null);
  const [driverCoordB, setDriverCoordB] = useState(null);
  const [driverStopsCoords, setDriverStopsCoords] = useState([]);
  const [driverRouteGeometry, setDriverRouteGeometry] = useState(null);
  const [driverDistance, setDriverDistance] = useState(null);
  const [driverDuration, setDriverDuration] = useState(null);
  const [driverRouteLoading, setDriverRouteLoading] = useState(false);

  // Post Route form state
  const [routeForm, setRouteForm] = useState({ date: "", truckType: "medium", price: "" });

  const router = useRouter();

  const fetchTrips = (token) => {
    // Fetch driver's active/past trips
    fetch("/api/trips", { headers: { "Authorization": `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setTrips(data.trips || []));

    // Fetch all pending requests
    fetch("/api/trips?pending=true", { headers: { "Authorization": `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setPendingTrips(data.trips || []));

    // Fetch driver's posted empty routes
    fetch(`/api/route-posts?driverId=${JSON.parse(localStorage.getItem("user")).id}`, { headers: { "Authorization": `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setPostedRoutes(data.routes || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser.role !== "driver") {
      router.push("/dashboard");
      return;
    }
    setUser(storedUser);
    fetchTrips(token);
  }, [router]);

  const activeTrips = trips.filter(t => ["accepted", "running"].includes(t.status));
  const pastTrips = trips.filter(t => ["completed", "cancelled"].includes(t.status));

  // Compute stats for driver overview
  const totalCompletedTrips = pastTrips.filter(t => t.status === "completed").length;
  // Calculate total profit for driver (assuming 100% of price for now)
  const totalProfit = pastTrips.filter(t => t.status === "completed").reduce((acc, curr) => acc + (curr.price || 0), 0);
  const activeCount = activeTrips.length;

  const updateTripStatus = async (tripId, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/trips", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ tripId, status: newStatus })
      });
      if (res.ok) {
        toast.success(`Trip status updated to ${newStatus}`);
        fetchTrips(token);
        if (newStatus === "accepted") {
          setActiveTab("active");
        }
      }
    } catch (err) {
      toast.error("Failed to update trip status");
    }
  };

  // --- CHAT LOGIC ---
  const loadMessages = (tripId) => {
    const token = localStorage.getItem("token");
    fetch(`/api/chat?tripId=${tripId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setMessages(data.messages || []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });
  };

  useEffect(() => {
    let interval;
    if (activeTab === "chat" && selectedTrip) {
      loadMessages(selectedTrip._id);
      interval = setInterval(() => loadMessages(selectedTrip._id), 3000);
    }
    return () => clearInterval(interval);
  }, [activeTab, selectedTrip]);

  const lastMessageCountRef = useRef({});

  // Background message monitoring for notifications
  useEffect(() => {
    if (!activeTrips || activeTrips.length === 0) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Initialize counts if not set yet
    activeTrips.forEach(trip => {
      if (lastMessageCountRef.current[trip._id] === undefined) {
        fetch(`/api/chat?tripId=${trip._id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.messages) {
              lastMessageCountRef.current[trip._id] = data.messages.length;
            }
          })
          .catch(err => console.error(err));
      }
    });

    const interval = setInterval(() => {
      activeTrips.forEach(trip => {
        fetch(`/api/chat?tripId=${trip._id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.messages) {
              const currentCount = lastMessageCountRef.current[trip._id] || 0;
              const newCount = data.messages.length;

              if (newCount > currentCount) {
                const lastMsg = data.messages[newCount - 1];
                // Check if last message was sent by the other party
                if (lastMsg && lastMsg.senderId !== user?.id) {
                  // Only show toast if not currently viewing this trip's chat
                  if (!(activeTab === "chat" && selectedTrip?._id === trip._id)) {
                    toast((t) => (
                      <div className="flex flex-col gap-1.5 min-w-[250px]">
                        <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                          <span>💬</span> New message from Customer!
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          ID: {trip._id.slice(-6).toUpperCase()} ({trip.pickup.split(',')[0]} → {trip.dropoff.split(',')[0]})
                        </div>
                        <div className="text-xs text-gray-700 italic bg-slate-50 border-l-2 border-orange-500 pl-2 py-1 mt-1 rounded-r-md">
                          "{lastMsg.text}"
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTrip(trip);
                            setActiveTab("chat");
                            toast.dismiss(t.id);
                          }}
                          className="mt-2 text-xs font-bold text-orange-600 bg-orange-50 py-1.5 px-3 rounded-lg hover:bg-orange-100 transition-colors w-max"
                        >
                          Reply to Customer 👤
                        </button>
                      </div>
                    ), {
                      duration: 6000,
                      position: "bottom-right",
                      style: {
                        background: '#ffffff',
                        border: '1px solid #f3f4f6',
                        borderRadius: '1.25rem',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
                        padding: '12px'
                      }
                    });
                  }
                }
                lastMessageCountRef.current[trip._id] = newCount;
              }
            }
          })
          .catch(err => console.error(err));
      });
    }, 4500); // Poll every 4.5 seconds

    return () => clearInterval(interval);
  }, [activeTrips, user, activeTab, selectedTrip]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedTrip) return;

    const token = localStorage.getItem("token");
    const sentText = text;
    setText("");

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ tripId: selectedTrip._id, text: sentText })
      });
      loadMessages(selectedTrip._id);
    } catch (err) {
      console.error(err);
    }
  };

  const submitDriverReview = async () => {
    const token = localStorage.getItem("token");
    if (!token || !selectedTrip) return;

    try {
      const res = await fetch("/api/trips", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          tripId: selectedTrip._id,
          driverRating: reviewRating,
          driverReview: reviewText
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Client review submitted successfully!");
        
        // Update the selected trip object in local state immediately so it renders as reviewed
        setSelectedTrip(data.trip);
        
        // Also update the trip in the global trips state list so it updates across the dashboard tabs
        setTrips(prevTrips => prevTrips.map(t => t._id === data.trip._id ? data.trip : t));
        
        // Reset review state
        setReviewRating(5);
        setReviewText("");
      } else {
        toast.error("Failed to submit client review");
      }
    } catch (err) {
      toast.error("Error submitting review");
    }
  };

  const calculateDriverRoute = async () => {
    if (!driverFrom.trim() || !driverTo.trim()) {
      toast.error("Please enter Initial Dispatch Hub and Final Destination Terminal");
      return;
    }
    setDriverRouteLoading(true);
    try {
      const [a, b] = await Promise.all([geocode(driverFrom), geocode(driverTo)]);
      if (!a) throw new Error(`Could not find dispatch hub: "${driverFrom}"`);
      if (!b) throw new Error(`Could not find target terminal: "${driverTo}"`);

      setDriverCoordA(a);
      setDriverCoordB(b);

      const transitCoords = [];
      for (const stop of driverStops) {
        if (stop.trim()) {
          const coord = await geocode(stop);
          if (coord) {
            transitCoords.push(coord);
          } else {
            toast.error(`Could not locate transit stop: "${stop}". Ignoring.`);
          }
        }
      }
      setDriverStopsCoords(transitCoords);

      const coordsString = [
        `${a.lon},${a.lat}`,
        ...transitCoords.map(coord => `${coord.lon},${coord.lat}`),
        `${b.lon},${b.lat}`
      ].join(';');

      const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code !== "Ok") throw new Error("Route mapping calculation failed");

      const route = data.routes[0];
      setDriverDistance(route.distance / 1000);
      setDriverDuration(Math.round(route.duration / 60));
      setDriverRouteGeometry(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]));

      toast.success("Return route processed successfully! Leaflet Map has been updated.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDriverRouteLoading(false);
    }
  };

  const handlePostRoute = async (e) => {
    e.preventDefault();
    if (!driverFrom.trim() || !driverTo.trim() || !routeForm.date) {
      toast.error("Please enter Dispatch Hub, Destination Terminal, and Return Date.");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/route-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          origin: driverFrom,
          destination: driverTo,
          viaStops: driverStops.filter(s => s.trim() !== ""),
          price: routeForm.price ? Number(routeForm.price) : Math.round((driverDistance || 100) * 12),
          date: routeForm.date,
          truckType: routeForm.truckType || "medium"
        })
      });
      if (res.ok) {
        toast.success("Empty return route published successfully!");
        setDriverFrom("Pune");
        setDriverTo("Mumbai");
        setDriverStops([]);
        setDriverCoordA(null);
        setDriverCoordB(null);
        setDriverStopsCoords([]);
        setDriverRouteGeometry(null);
        setDriverDistance(null);
        setDriverDuration(null);
        setRouteForm({ date: "", truckType: "medium", price: "" });
        
        // Re-fetch route posts
        fetch("/api/route-posts?driverId=" + user.id)
          .then(res => res.json())
          .then(data => setPostedRoutes(data.routes || []));
      } else {
        toast.error("Failed to post empty route");
      }
    } catch (err) {
      toast.error("Error publishing empty return route");
    }
  };

  const handleOpenChat = (trip) => {
    setSelectedTrip(trip);
    setActiveTab("chat");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pt-24 px-4 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-6 pb-6 md:h-[calc(100vh-6rem)] md:overflow-hidden">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
            <div className="px-4 py-3 mb-2 border-b border-gray-50">
              <p className="text-xs uppercase tracking-widest font-bold text-gray-400">Driver Menu</p>
            </div>
            {[
              { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} /> },
              { id: "post-route", label: "Post Empty Route", icon: <PlusCircle size={20} /> },
              { id: "find-loads", label: "Find Loads", icon: <Search size={20} /> },
              { id: "active", label: "Active Trips", icon: <Truck size={20} /> },
              { id: "past", label: "Past Trips", icon: <CheckCircle size={20} /> },
              { id: "chat", label: "Messages", icon: <MessageSquare size={20} /> },
              { id: "settings", label: "Settings", icon: <Settings size={20} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  activeTab === tab.id 
                    ? "bg-orange-500 text-white shadow-md shadow-orange-200" 
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
          
          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="p-8 overflow-y-auto h-full bg-gray-50/30">
              <h2 className="text-3xl font-extrabold font-serif mb-6 text-gray-900">Driver Performance</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                      <CheckCircle size={24} />
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium text-sm mb-1">Completed Trips</p>
                    <h3 className="text-4xl font-extrabold text-gray-900 font-serif">{totalCompletedTrips}</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                      <Star size={24} className="fill-amber-500 text-amber-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium text-sm mb-1">Your Driver Rating</p>
                    <h3 className="text-4xl font-extrabold text-gray-900 font-serif">⭐ {user?.rating || "5.0"}</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                      <CreditCard size={24} />
                    </div>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Total Earnings</span>
                  </div>
                  <div className="relative z-10">
                    <p className="text-gray-500 font-medium text-sm mb-1">Lifetime Profit Generated</p>
                    <h3 className="text-4xl font-extrabold text-gray-900 font-serif text-green-600 font-bold">₹{totalProfit.toLocaleString()}</h3>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 text-lg">Your Active Transports</h3>
                    <button onClick={() => setActiveTab("active")} className="text-orange-500 text-sm font-bold hover:underline">View All</button>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    {activeTrips.length > 0 ? (
                      <div className="space-y-4">
                        {activeTrips.slice(0, 3).map(trip => (
                          <div key={trip._id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                              <Truck size={18} />
                            </div>
                            <div className="flex-1 truncate">
                              <p className="font-bold text-gray-900 text-sm truncate">{trip.pickup} → {trip.dropoff}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{trip.status.toUpperCase()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-8 flex flex-col items-center">
                        <Truck size={32} className="mb-2 opacity-20" />
                        <p>No active transports right now.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-3xl border border-gray-800 shadow-md p-6 text-white flex flex-col relative overflow-hidden group">
                  <div className="absolute right-0 bottom-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl group-hover:bg-orange-500/30 transition-all pointer-events-none"></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-6 backdrop-blur-md border border-white/10">
                      <MapPin size={24} />
                    </div>
                    <div className="mt-auto">
                      <h3 className="text-2xl font-bold font-serif mb-2">{pendingTrips.length} Load(s) Available!</h3>
                      <p className="text-gray-400 text-sm mb-6 max-w-xs">Customers are actively looking for drivers. Accept a load to start earning.</p>
                      <button 
                        onClick={() => setActiveTab("find-loads")} 
                        className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                      >
                        Find New Loads
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: POST ROUTE */}
          {activeTab === "post-route" && (
            <div className="p-8 overflow-y-auto h-full bg-slate-50/50">
              <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                  <span className="bg-orange-100 text-orange-850 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Empty Return Optimizer</span>
                  <h2 className="text-3xl font-extrabold font-serif mt-2 text-gray-900">Post Empty Return Route</h2>
                  <p className="text-gray-550 mt-1 text-xs">Convert empty return miles into high-margin profit by plotting your return schedule on Leaflet OSRM Maps.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 items-stretch">
                  {/* Left Side: Route Form */}
                  <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <form onSubmit={handlePostRoute} className="space-y-5">
                      
                      {/* Dispatch Hub Names */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">Initial Dispatch Terminal (Origin)</label>
                          <input 
                            type="text" 
                            required 
                            value={driverFrom} 
                            onChange={e => setDriverFrom(e.target.value)} 
                            placeholder="e.g. Pune" 
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-semibold" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">Final Target Terminal (Destination)</label>
                          <input 
                            type="text" 
                            required 
                            value={driverTo} 
                            onChange={e => setDriverTo(e.target.value)} 
                            placeholder="e.g. Mumbai" 
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-semibold" 
                          />
                        </div>
                      </div>

                      {/* Via Transit Stops */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">Via Transit Stops</label>
                          <button 
                            type="button" 
                            onClick={() => setDriverStops(prev => [...prev, ""])}
                            className="text-[10px] font-bold text-orange-500 hover:text-orange-600 transition-colors uppercase tracking-wider flex items-center gap-1"
                          >
                            + Add Transit Stop
                          </button>
                        </div>
                        
                        {driverStops.length === 0 ? (
                          <p className="text-[11px] text-gray-400 italic">No transit stops added yet. Click above to add intermediate stops.</p>
                        ) : (
                          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                            {driverStops.map((stop, index) => (
                              <div key={index} className="flex gap-2 items-center">
                                <span className="text-[11px] font-bold text-gray-405 min-w-[20px]">#{index + 1}</span>
                                <input
                                  type="text"
                                  value={stop}
                                  onChange={e => {
                                    const nextStops = [...driverStops];
                                    nextStops[index] = e.target.value;
                                    setDriverStops(nextStops);
                                  }}
                                  placeholder="e.g. Lonavala"
                                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 text-xs font-medium"
                                />
                                <button 
                                  type="button" 
                                  onClick={() => setDriverStops(prev => prev.filter((_, idx) => idx !== index))}
                                  className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-50 my-2"></div>

                      {/* Route Fare and Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">Asking Return Fare (₹)</label>
                          <input 
                            type="number" 
                            value={routeForm.price} 
                            onChange={e => setRouteForm({...routeForm, price: e.target.value})} 
                            placeholder={driverDistance ? `Est: ₹${Math.round(driverDistance * 12)}` : "Enter custom price"} 
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-semibold" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">Return Date</label>
                          <input 
                            type="date" 
                            required 
                            value={routeForm.date} 
                            onChange={e => setRouteForm({...routeForm, date: e.target.value})} 
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-semibold" 
                          />
                        </div>
                      </div>

                      {/* Fleet Selection */}
                      <div>
                        <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">Available Fleet Capacity</label>
                        <select 
                          value={routeForm.truckType} 
                          onChange={e => setRouteForm({...routeForm, truckType: e.target.value})} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-semibold bg-white"
                        >
                          <option value="Mini">Mini (Tata Ace) - 1 Ton Capacity</option>
                          <option value="Medium">Medium (Pickup 8ft) - 3 Ton Capacity</option>
                          <option value="Heavy">Heavy (Truck 14ft) - 10 Ton Capacity</option>
                        </select>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          type="button"
                          disabled={driverRouteLoading}
                          onClick={calculateDriverRoute}
                          className="flex-1 bg-gray-105 text-gray-800 font-bold py-3 rounded-xl border border-gray-200 text-xs hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                        >
                          {driverRouteLoading ? (
                            <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            "Calculate & Preview Route"
                          )}
                        </button>
                        
                        <button 
                          type="submit" 
                          className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-xl text-xs hover:bg-orange-600 transition-colors shadow-md shadow-orange-100 flex items-center justify-center"
                        >
                          Publish Empty Return Route
                        </button>
                      </div>

                    </form>
                  </div>

                  {/* Right Side: Leaflet Map Preview */}
                  <div className="lg:col-span-6 flex flex-col bg-white p-4 rounded-3xl border border-gray-100 shadow-sm min-h-[350px]">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
                        Map Router Preview
                      </h4>
                      {driverDistance && (
                        <div className="flex gap-3 text-[11px] font-bold text-gray-500">
                          <span>📏 {driverDistance.toFixed(1)} km</span>
                          <span>⏱️ {Math.floor(driverDuration / 60)}h {driverDuration % 60}m</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 h-full min-h-[300px] relative">
                      {driverCoordA && driverCoordB ? (
                        <LeafletMap 
                          pointA={driverCoordA} 
                          pointB={driverCoordB} 
                          viaStopsCoords={driverStopsCoords} 
                          routeGeometry={driverRouteGeometry} 
                        />
                      ) : (
                        <div className="w-full h-full min-h-[300px] bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-6">
                          <MapPin size={32} className="text-slate-350 mb-2 opacity-50" />
                          <p className="text-xs font-semibold text-slate-500">No route active yet</p>
                          <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Fill in Dispatch Terminal, Destination Terminal and click "Calculate & Preview Route".</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Published Routes Grid */}
                <div className="mt-10">
                  <h3 className="font-serif font-extrabold text-gray-900 text-xl mb-4">Your Published Fleet Schedules</h3>
                  {postedRoutes.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm">
                      <Truck size={36} className="mx-auto mb-2 opacity-20" />
                      <p className="text-xs font-semibold">No schedules posted yet.</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Your optimized empty return routes will appear here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {postedRoutes.map(route => (
                        <div key={route._id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full ${route.status === 'active' ? 'bg-green-50 text-green-700 border border-green-150' : 'bg-gray-150 text-gray-500'}`}>
                                {route.status}
                              </span>
                              <span className="text-[10px] font-bold text-gray-450">{route.date}</span>
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm truncate">{route.origin} → {route.destination}</h4>
                            
                            {route.viaStops && route.viaStops.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {route.viaStops.map((stop, i) => (
                                  <span key={i} className="text-[9px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-md">
                                    via {stop}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="text-[11px] text-gray-555 mt-2 font-semibold text-orange-600">Fleet: {route.truckType}</p>
                          </div>
                          <div className="mt-4 border-t border-gray-50 pt-3 flex justify-between items-center">
                            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Asking Return Fare</span>
                            <span className="text-base font-black text-gray-900">₹{route.price.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB: FIND LOADS */}
          {activeTab === "find-loads" && (
            <div className="p-8 overflow-y-auto h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-extrabold font-serif text-gray-900">Available Loads</h2>
                <div className="text-sm font-medium text-gray-500">Live Requests</div>
              </div>
              {pendingTrips.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                  No loads available currently. Check back soon.
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingTrips.map(trip => (
                    <div key={trip._id} className="p-5 rounded-2xl border border-gray-100 hover:border-orange-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-yellow-100 text-yellow-700 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full">New Request</span>
                          <span className="text-sm font-medium text-gray-500">Customer: {trip.userId?.name || "Anonymous"} (⭐ {trip.userId?.rating || "5.0"})</span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">{trip.pickup} <span className="text-orange-500">→</span> {trip.dropoff}</h3>
                        <p className="text-sm text-gray-500 mt-1">{trip.truckType} · {trip.distance} km</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="font-bold text-gray-900 text-xl">₹{trip.price}</div>
                        <button onClick={() => updateTripStatus(trip._id, "accepted")} className="px-5 py-2 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-gray-800 transition-colors shadow-md shadow-gray-200">
                          Accept Load
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: ACTIVE TRIPS */}
          {activeTab === "active" && (
            <div className="p-8 overflow-y-auto h-full">
              <h2 className="text-3xl font-extrabold font-serif mb-6 text-gray-900">Active Transportation</h2>
              {activeTrips.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-2xl border border-gray-100">You have no active trips.</div>
              ) : (
                <div className="grid gap-4">
                  {activeTrips.map(trip => (
                    <div key={trip._id} className="p-5 rounded-2xl border border-gray-100 hover:border-orange-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-orange-100 text-orange-700 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full">{trip.status}</span>
                          <span className="text-sm font-bold text-gray-400">ID: {trip._id.slice(-6).toUpperCase()}</span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">{trip.pickup} <span className="text-orange-500">→</span> {trip.dropoff}</h3>
                        <p className="text-sm text-gray-500 mt-1">Customer: {trip.userId?.name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button onClick={() => handleOpenChat(trip)} className="px-4 py-2 w-full bg-orange-50 text-orange-600 font-bold rounded-xl text-sm hover:bg-orange-100 transition-colors">
                          Message Customer
                        </button>
                        <button onClick={() => updateTripStatus(trip._id, "completed")} className="px-4 py-2 w-full bg-green-500 text-white font-bold rounded-xl text-sm hover:bg-green-600 transition-colors shadow-md">
                          Complete & Get Paid
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PAST TRIPS */}
          {activeTab === "past" && (
            <div className="p-8 overflow-y-auto h-full">
              <h2 className="text-3xl font-extrabold font-serif mb-6 text-gray-900">Past Jobs</h2>
              {pastTrips.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No past jobs found.</div>
              ) : (
                <div className="grid gap-4">
                  {pastTrips.map(trip => (
                    <div key={trip._id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="opacity-70">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${trip.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{trip.status}</span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">{trip.pickup} <span className="text-gray-400">→</span> {trip.dropoff}</h3>
                        <p className="text-sm text-gray-500 mt-1">{new Date(trip.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="font-bold text-gray-900 text-lg">Earned: ₹{trip.price}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === "settings" && (
            <div className="p-8 overflow-y-auto h-full max-w-2xl">
              <h2 className="text-3xl font-extrabold font-serif mb-6 text-gray-900">Driver Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                  <input type="text" defaultValue={user?.name} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                  <input type="email" disabled defaultValue={user?.email} className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Base Location / Route</label>
                  <input type="text" defaultValue={user?.location || ""} placeholder="e.g. Mumbai, India" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                </div>

                <button onClick={() => toast.success("Settings saved successfully!")} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-gray-800 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* TAB: CHAT */}
          {activeTab === "chat" && (() => {
            const sortedChatTrips = [...trips].sort((a, b) => {
              if (chatSortBy === "name") {
                const nameA = a.userId?.name || "";
                const nameB = b.userId?.name || "";
                return nameA.localeCompare(nameB);
              } else {
                return new Date(b.createdAt) - new Date(a.createdAt);
              }
            });

            return (
              <div className="flex flex-col h-full bg-slate-50">
                <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center z-10 shrink-0">
                  <div>
                    <h3 className="font-bold text-gray-900 font-serif text-lg">
                      Customer Chat
                    </h3>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Select customer load</label>
                        <select 
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white text-gray-750 font-semibold"
                          onChange={(e) => setSelectedTrip(trips.find(t => t._id === e.target.value))}
                          value={selectedTrip?._id || ""}
                        >
                          <option value="" disabled>Select a trip</option>
                          {sortedChatTrips.map(t => (
                            <option key={t._id} value={t._id}>
                              {t.pickup.split(',')[0]} → {t.dropoff.split(',')[0]} ({t.userId?.name || "No User"}) {t.status === 'completed' ? '✅ Done' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Sort list by</label>
                        <select
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white text-gray-755 font-semibold cursor-pointer"
                          onChange={(e) => setChatSortBy(e.target.value)}
                          value={chatSortBy}
                        >
                          <option value="date">📅 Date (Newest first)</option>
                          <option value="name">👤 Customer Name</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedTrip ? (
                  <>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10 text-sm bg-white p-4 rounded-xl border border-gray-100 inline-block mx-auto">
                          Say hello to your customer and coordinate the pickup!
                        </div>
                      ) : (
                        messages.map(msg => {
                          const isMe = msg.senderId === user?.id;
                          const msgTime = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now";
                          return (
                            <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl text-sm flex flex-col ${isMe ? "bg-orange-500 text-white rounded-br-none shadow-orange-200 shadow-md" : "bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm"}`}>
                                <div>{msg.text}</div>
                                <div className={`text-[10px] flex items-center gap-1 mt-1 justify-end ${isMe ? "text-orange-100" : "text-gray-400"}`}>
                                  {msgTime}
                                  {isMe && (
                                    msg.status === "seen" ? <CheckCheck size={12} className="text-blue-200" /> :
                                    msg.status === "delivered" ? <CheckCheck size={12} /> :
                                    <Check size={12} />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input or Closed Chat Feedback Form */}
                    {selectedTrip.status === "completed" ? (
                      <div className="p-6 bg-white border-t border-gray-100 shrink-0 flex flex-col gap-4">
                        <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 text-center max-w-xl mx-auto w-full">
                          <span className="text-xl">✅</span>
                          <h4 className="font-bold text-gray-900 text-sm mt-1">This job is completed!</h4>
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">The chat session has ended. Share your feedback on the client/receiver below.</p>
                        </div>

                        {/* Review / Feedback Section */}
                        {selectedTrip.driverRating !== undefined && selectedTrip.driverRating !== null ? (
                          <div className="text-center max-w-xl mx-auto w-full p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                            <p className="text-xs font-black text-emerald-850">🎉 Thank you! Your feedback on the customer has been recorded successfully.</p>
                            <div className="flex justify-center items-center gap-1.5 mt-2">
                              <span className="text-xs font-semibold text-gray-600">Your Rating:</span>
                              <span className="text-sm font-black text-amber-500">{"★".repeat(selectedTrip.driverRating)}{"☆".repeat(5 - selectedTrip.driverRating)}</span>
                              <span className="text-xs font-bold text-gray-500">({selectedTrip.driverRating} / 5)</span>
                            </div>
                            {selectedTrip.driverReview && (
                              <p className="text-xs text-gray-500 italic mt-3 bg-white/70 py-2 px-3 rounded-xl border border-emerald-100/50">"{selectedTrip.driverReview}"</p>
                            )}
                          </div>
                        ) : (
                          <div className="max-w-xl mx-auto w-full bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                            <h5 className="font-bold text-gray-800 text-xs uppercase tracking-wide mb-3">Rate your Customer ({selectedTrip.userId?.name || "Customer"})</h5>
                            
                            <div className="flex gap-2.5 mb-4">
                              {[1, 2, 3, 4, 5].map((stars) => (
                                <button
                                  key={stars}
                                  type="button"
                                  onClick={() => setReviewRating(stars)}
                                  className={`text-2xl transition-all ${
                                    reviewRating >= stars ? "text-amber-500 scale-110" : "text-gray-200 hover:text-amber-400"
                                  }`}
                                >
                                  ★
                              </button>
                              ))}
                            </div>

                            <textarea
                              value={reviewText}
                              onChange={(e) => setReviewText(e.target.value)}
                              placeholder="Write a brief review about the pickup process readiness, weight specifications correctness, and payments speed..."
                              rows={3}
                              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs mb-3 resize-none font-medium"
                            />

                            <button
                              onClick={submitDriverReview}
                              className="w-full bg-orange-500 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-orange-600 transition-colors shadow-md shadow-orange-100"
                            >
                              Submit Review & Rating
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Chat Input */
                      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                        <form onSubmit={sendMessage} className="flex gap-3 max-w-4xl mx-auto">
                          <input
                            type="text"
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                          />
                          <button 
                            type="submit"
                            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-orange-200 hover:bg-orange-600 transition-colors"
                          >
                            Send
                          </button>
                        </form>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <MessageSquare size={48} className="mb-4 opacity-50" />
                    <p>Select an active or completed trip to coordinate or submit feedback</p>
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </main>
    </div>
  );
}

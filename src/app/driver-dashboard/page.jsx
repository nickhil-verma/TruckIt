"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { LayoutDashboard, Search, Truck, CheckCircle, MessageSquare, Settings, CreditCard, Check, CheckCheck, MapPin, PlusCircle, Star, Trash2 } from "lucide-react";

async function reverseGeocode(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
    return "Unknown Location";
  }
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12`;
  try {
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data = await res.json();
    if (!data) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    const address = data.address || {};
    const name = address.city || address.town || address.village || address.suburb || address.county || data.display_name.split(',')[0];
    return name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  try {
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data = await res.json();
    if (!data || !data.length) return null;
    return {
      name: data[0].display_name.split(',')[0],
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon)
    };
  } catch {
    return null;
  }
}
const LeafletMap = dynamic(() => import("@/components/LeafletMapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <span className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
        <span className="text-xs font-semibold text-slate-550">Loading OpenStreetMap Engine...</span>
      </div>
    </div>
  )
});

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
  
  // Settings specific state
  const [settingsName, setSettingsName] = useState("");
  const [settingsLocation, setSettingsLocation] = useState("");
  const [settingsTruckNumber, setSettingsTruckNumber] = useState("");
  const [settingsLicenseNumber, setSettingsLicenseNumber] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrNameMatched, setOcrNameMatched] = useState(null); // null, true, false
  const [ocrProgress, setOcrProgress] = useState("");
  
  // Geocoding and routing states for driver route posts (Click to Route)
  const [driverPointA, setDriverPointA] = useState(null); // { name, lat, lon }
  const [driverPointB, setDriverPointB] = useState(null); // { name, lat, lon }
  const [driverStopsList, setDriverStopsList] = useState([]); // array of { name, lat, lon }
  const [driverRouteGeometry, setDriverRouteGeometry] = useState(null);
  const [driverDistance, setDriverDistance] = useState(null);
  const [driverDuration, setDriverDuration] = useState(null);
  const [driverRouteLoading, setDriverRouteLoading] = useState(false);
  const [resolvingPoint, setResolvingPoint] = useState(false);

  // Text inputs for typed address locations
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [textStops, setTextStops] = useState([]);

  // Sync state from point changes (clicks) to text values
  useEffect(() => {
    if (driverPointA) setTextA(driverPointA.name);
  }, [driverPointA]);

  useEffect(() => {
    if (driverPointB) setTextB(driverPointB.name);
  }, [driverPointB]);

  useEffect(() => {
    setTextStops(driverStopsList.map(s => s.name || ""));
  }, [driverStopsList]);

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
    setSettingsName(storedUser.name || "");
    setSettingsLocation(storedUser.location || "");
    setSettingsTruckNumber(storedUser.truckNumber || "");
    setSettingsLicenseNumber(storedUser.licenseNumber || "");
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

  const handleMapClick = async (lat, lon) => {
    setResolvingPoint(true);
    const name = await reverseGeocode(lat, lon);
    setResolvingPoint(false);
    
    if (!driverPointA) {
      setDriverPointA({ name, lat, lon });
      toast.success(`Origin dispatch hub set to: ${name}`);
    } else if (!driverPointB) {
      setDriverPointB({ name, lat, lon });
      toast.success(`Destination terminal set to: ${name}`);
    } else {
      setDriverStopsList(prev => [...prev, { name, lat, lon }]);
      toast.success(`Transit stop added: ${name}`);
    }
  };

  const resetDriverRoute = () => {
    setDriverPointA(null);
    setDriverPointB(null);
    setDriverStopsList([]);
    setDriverRouteGeometry(null);
    setDriverDistance(null);
    setDriverDuration(null);
    setRouteForm({ date: "", truckType: "medium", price: "" });
    toast.success("Route planning cleared. Click the map to start over.");
  };

  const resolvePointA = async (query) => {
    if (!query || !query.trim()) return;
    setResolvingPoint(true);
    const point = await geocode(query);
    setResolvingPoint(false);
    if (point) {
      setDriverPointA(point);
      toast.success(`Origin dispatch terminal updated to: ${point.name}`);
    } else {
      toast.error(`Could not locate: "${query}"`);
    }
  };

  const resolvePointB = async (query) => {
    if (!query || !query.trim()) return;
    setResolvingPoint(true);
    const point = await geocode(query);
    setResolvingPoint(false);
    if (point) {
      setDriverPointB(point);
      toast.success(`Destination terminal updated to: ${point.name}`);
    } else {
      toast.error(`Could not locate: "${query}"`);
    }
  };

  const resolveStopIndex = async (index, query) => {
    if (!query || !query.trim()) return;
    setResolvingPoint(true);
    const point = await geocode(query);
    setResolvingPoint(false);
    if (point) {
      setDriverStopsList(prev => {
        const next = [...prev];
        next[index] = point;
        return next;
      });
      toast.success(`Stop #${index + 1} resolved to: ${point.name}`);
    } else {
      toast.error(`Could not locate stop: "${query}"`);
    }
  };

  const addEmptyTransitStop = () => {
    setTextStops(prev => [...prev, ""]);
    setDriverStopsList(prev => [...prev, { name: "", lat: 0, lon: 0 }]);
  };

  const removeTransitStop = (index) => {
    setTextStops(prev => prev.filter((_, i) => i !== index));
    setDriverStopsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleStopTextChange = (index, value) => {
    setTextStops(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // Automatically calculate route whenever selected points change
  useEffect(() => {
    if (!driverPointA || !driverPointB) {
      setDriverRouteGeometry(null);
      setDriverDistance(null);
      setDriverDuration(null);
      return;
    }

    const calculateRoute = async () => {
      setDriverRouteLoading(true);
      try {
        const coordsString = [
          `${driverPointA.lon},${driverPointA.lat}`,
          ...driverStopsList.map(p => `${p.lon},${p.lat}`),
          `${driverPointB.lon},${driverPointB.lat}`
        ].join(";");

        const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.code !== "Ok") throw new Error("OSRM calculation failed");

        const route = data.routes[0];
        if (route) {
          setDriverDistance(route.distance / 1000);
          setDriverDuration(Math.round(route.duration / 60));
          if (route.geometry && Array.isArray(route.geometry.coordinates)) {
            setDriverRouteGeometry(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]));
          } else {
            setDriverRouteGeometry([]);
          }
        } else {
          throw new Error("No route found");
        }
      } catch (err) {
        console.error("OSRM calculation error:", err);
        setDriverRouteGeometry(null);
        setDriverDistance(null);
        setDriverDuration(null);
      } finally {
        setDriverRouteLoading(false);
      }
    };

    calculateRoute();
  }, [driverPointA, driverPointB, driverStopsList]);

  const handleOcr = async (file) => {
    if (!file) return;
    setOcrLoading(true);
    setOcrNameMatched(null);
    setOcrText("");
    setOcrProgress("Starting OCR Engine...");

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      
      setOcrProgress("Analyzing license image...");
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      setOcrText(text);

      const cleanOcrText = text.toLowerCase().replace(/[^a-z0-9]/g, " ");
      const cleanName = settingsName.toLowerCase().trim();

      const nameParts = cleanName.split(/\s+/).filter(part => part.length > 2);
      
      let isMatch = false;
      if (nameParts.length > 0) {
        isMatch = nameParts.every(part => cleanOcrText.includes(part));
      }

      if (isMatch) {
        setOcrNameMatched(true);
        toast.success("License name matched successfully!");
      } else {
        setOcrNameMatched(false);
        toast.error("Name in driving license does not match registered name.");
      }
    } catch (err) {
      console.error(err);
      toast.error("OCR analysis failed. Please try a clearer image.");
      setOcrProgress("Failed to read image");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settingsName) {
      toast.error("Name is required");
      return;
    }
    const cleanTruck = settingsTruckNumber.replace(/\s+/g, "").toUpperCase();
    const truckRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
    if (!truckRegex.test(cleanTruck)) {
      toast.error("Invalid Indian Truck Number format (e.g. MH12AB1234)");
      return;
    }

    const cleanLicense = settingsLicenseNumber.replace(/\s+/g, "").toUpperCase();
    const licenseRegex = /^[A-Z]{2}[0-9]{2}[0-9]{11}$/;
    if (!licenseRegex.test(cleanLicense)) {
      toast.error("Invalid Driving License format (e.g. MH1220180001234)");
      return;
    }

    if (ocrNameMatched === false) {
      toast.error("Cannot save settings. Name on Driving License does not match registered name!");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: settingsName,
          location: settingsLocation,
          truckNumber: settingsTruckNumber,
          licenseNumber: settingsLicenseNumber
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Settings saved successfully!");
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (err) {
      toast.error("Network error saving settings");
    }
  };

  const handleDeleteRoutePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this posted route?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/route-posts?id=${postId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Empty return route deleted successfully");
        setPostedRoutes(prev => prev.filter(r => r._id !== postId));
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete route");
      }
    } catch (err) {
      toast.error("Error deleting route");
    }
  };

  const handlePostRoute = async (e) => {
    e.preventDefault();
    if (!driverPointA || !driverPointB || !routeForm.date) {
      toast.error("Please set Origin and Destination on the map, and specify a return date.");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/route-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          origin: driverPointA.name,
          destination: driverPointB.name,
          viaStops: driverStopsList.map(p => p.name),
          price: routeForm.price ? Number(routeForm.price) : Math.round((driverDistance || 100) * 12),
          date: routeForm.date,
          truckType: routeForm.truckType || "medium"
        })
      });
      if (res.ok) {
        toast.success("Empty return route published successfully!");
        resetDriverRoute();
        
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
                <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Interactive Map Dispatcher
                    </span>
                    <h2 className="text-3xl font-extrabold font-serif mt-2 text-gray-900">Post Empty Return Route</h2>
                    <p className="text-gray-500 mt-1 text-xs">
                      No more boring typing! Simply click on the OpenStreetMap below to plot your return route dynamically.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetDriverRoute}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all border border-gray-200"
                  >
                    Reset & Clear Map
                  </button>
                </div>

                {/* Map-First Split Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  
                  {/* Left Column: Interactive Routing Console */}
                  <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-6">
                    
                    {/* Routing State Wizard */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-605 mb-2">Routing Status</h3>
                      
                      {/* Step 1: Origin */}
                      {/* Step 1: Origin */}
                      <div className={`p-4 rounded-2xl border transition-all ${driverPointA ? 'bg-orange-50/40 border-orange-200' : 'bg-slate-50 border-slate-100 border-dashed animate-pulse'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-black text-orange-600 tracking-wider">Point A: Dispatch Hub</span>
                          {driverPointA && (
                            <span className="text-[10px] bg-orange-100 text-orange-850 px-2 py-0.5 rounded font-bold">SET</span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <input 
                            type="text" 
                            value={textA}
                            onChange={e => setTextA(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); resolvePointA(textA); } }}
                            placeholder="Type Origin (e.g. Pune) & search"
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-semibold bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => resolvePointA(textA)}
                            className="px-3 bg-orange-500 text-white hover:bg-orange-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 shadow-sm"
                          >
                            Find
                          </button>
                        </div>
                      </div>

                      {/* Step 2: Destination */}
                      <div className={`p-4 rounded-2xl border transition-all ${driverPointB ? 'bg-green-50/40 border-green-200' : driverPointA ? 'bg-slate-50 border-slate-100 border-dashed animate-pulse' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-black text-green-600 tracking-wider">Point B: Target Hub</span>
                          {driverPointB && (
                            <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">SET</span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <input 
                            type="text" 
                            disabled={!driverPointA}
                            value={textB}
                            onChange={e => setTextB(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); resolvePointB(textB); } }}
                            placeholder={driverPointA ? "Type Destination & search" : "Waiting for Origin..."}
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-xs font-semibold bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                          />
                          <button
                            type="button"
                            disabled={!driverPointA}
                            onClick={() => resolvePointB(textB)}
                            className="px-3 bg-green-600 text-white hover:bg-green-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 shadow-sm disabled:bg-gray-200 disabled:cursor-not-allowed"
                          >
                            Find
                          </button>
                        </div>
                      </div>

                      {/* Step 3: Transit Stops */}
                      <div className={`p-4 rounded-2xl border transition-all ${driverPointB ? 'bg-purple-50/30 border-purple-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-black text-purple-750 tracking-wider">Transit Stops</span>
                          <button 
                            type="button" 
                            disabled={!driverPointB}
                            onClick={addEmptyTransitStop}
                            className="text-[9px] font-black text-purple-600 hover:text-purple-800 transition-colors uppercase tracking-wider flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            + Add Typed Stop
                          </button>
                        </div>
                        {textStops.length === 0 ? (
                          <p className="text-xs text-gray-400 italic mt-1.5">
                            {driverPointB ? "➕ Click map or click Add Typed Stop above" : "Waiting for Point B..."}
                          </p>
                        ) : (
                          <div className="mt-2 space-y-2 max-h-[180px] overflow-y-auto pr-1">
                            {textStops.map((stop, idx) => (
                              <div key={idx} className="flex gap-2 items-center bg-purple-50/20 p-2.5 rounded-2xl border border-purple-100">
                                <span className="text-[10px] font-black text-purple-500 w-5 shrink-0">#{idx + 1}</span>
                                <input
                                  type="text"
                                  value={stop}
                                  onChange={e => handleStopTextChange(idx, e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); resolveStopIndex(idx, stop); } }}
                                  placeholder="Type stop name & search"
                                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-205 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => resolveStopIndex(idx, stop)}
                                  className="px-2.5 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold shrink-0"
                                >
                                  Find
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeTransitStop(idx)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    <div className="border-t border-gray-100 my-2"></div>

                    {/* Return Fare and Date controls */}
                    <form onSubmit={handlePostRoute} className="space-y-4">
                      
                      <div>
                        <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-3">Asking Return Fare (₹)</label>
                        {(() => {
                          const standardFare = driverDistance ? Math.round(driverDistance * 12) : 5000;
                          const minFare = Math.round(standardFare * 0.5);
                          const maxFare = Math.round(standardFare * 1.5);
                          const currentFare = routeForm.price ? Number(routeForm.price) : standardFare;

                          let sliderColor = "#eab308";
                          if (currentFare < standardFare) {
                            const ratio = (standardFare - currentFare) / (standardFare - minFare);
                            const l = 73 - (ratio * (73 - 36));
                            sliderColor = `hsl(142, 71%, ${l}%)`;
                          } else if (currentFare > standardFare) {
                            const ratio = (currentFare - standardFare) / (maxFare - standardFare);
                            const h = 25 - (ratio * 25);
                            sliderColor = `hsl(${h}, 95%, 53%)`;
                          }

                          return (
                            <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-xl border border-gray-100 relative">
                              <div className="flex justify-between items-end text-xs font-semibold mb-2">
                                <span className="text-gray-400 font-bold">Min: ₹{minFare}</span>
                                <div className="text-center flex flex-col items-center">
                                  <span className="text-[10px] uppercase font-bold text-gray-400 mb-0.5 tracking-wider">Your Price</span>
                                  <span className="font-black text-xl" style={{ color: sliderColor }}>₹{currentFare}</span>
                                </div>
                                <span className="text-gray-400 font-bold">Max: ₹{maxFare}</span>
                              </div>
                              <input 
                                type="range" 
                                min={minFare} 
                                max={maxFare} 
                                step="100"
                                value={currentFare} 
                                onChange={e => setRouteForm({...routeForm, price: e.target.value})} 
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer fare-slider" 
                                style={{
                                  background: `linear-gradient(to right, ${sliderColor} ${((currentFare - minFare) / (maxFare - minFare)) * 100}%, #e2e8f0 ${((currentFare - minFare) / (maxFare - minFare)) * 100}%)`,
                                }}
                              />
                              <style>{`
                                .fare-slider::-webkit-slider-thumb {
                                  -webkit-appearance: none;
                                  appearance: none;
                                  width: 22px;
                                  height: 22px;
                                  border-radius: 50%;
                                  background: white;
                                  border: 4px solid ${sliderColor};
                                  cursor: pointer;
                                  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
                                }
                                .fare-slider::-moz-range-thumb {
                                  width: 22px;
                                  height: 22px;
                                  border-radius: 50%;
                                  background: white;
                                  border: 4px solid ${sliderColor};
                                  cursor: pointer;
                                  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
                                }
                              `}</style>
                              <div className="text-center mt-2">
                                {currentFare === standardFare && <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md">Standard Fare</span>}
                                {currentFare < standardFare && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">Competitive Fare</span>}
                                {currentFare > standardFare && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">Premium Fare</span>}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1">Available Fleet Capacity</label>
                        <select 
                          value={routeForm.truckType} 
                          onChange={e => setRouteForm({...routeForm, truckType: e.target.value})} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-semibold bg-white"
                        >
                          <option value="Mini">Mini (Tata Ace) - 1 Ton</option>
                          <option value="Medium">Medium (Pickup 8ft) - 3 Ton</option>
                          <option value="Heavy">Heavy (Truck 14ft) - 10 Ton</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1">Return Date</label>
                        <input 
                          type="date" 
                          required 
                          value={routeForm.date} 
                          onChange={e => setRouteForm({...routeForm, date: e.target.value})} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-semibold" 
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={!driverPointA || !driverPointB}
                        className={`w-full font-bold py-3.5 rounded-2xl text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
                          driverPointA && driverPointB 
                            ? "bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-100 cursor-pointer" 
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Publish Empty Return Route
                      </button>

                    </form>

                  </div>

                  {/* Right Column: Dynamic Interactive Leaflet Map */}
                  <div className="lg:col-span-8 flex flex-col bg-white p-4 rounded-3xl border border-gray-100 shadow-sm relative min-h-[480px]">
                    <div className="absolute top-6 left-6 z-10 bg-slate-900/90 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-md border border-white/10 text-xs font-semibold">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
                      {resolvingPoint ? (
                        <span>Resolving location on OpenStreetMap...</span>
                      ) : !driverPointA ? (
                        <span>📍 Step 1: Click the map to drop your **Start Origin Hub**</span>
                      ) : !driverPointB ? (
                        <span>🏁 Step 2: Click the map to drop your **Final Destination Hub**</span>
                      ) : (
                        <span>✨ Complete! Optionally click additional locations to add via-stops.</span>
                      )}
                    </div>

                    {driverDistance && (
                      <div className="absolute top-6 right-6 z-10 bg-white/90 text-slate-800 px-4 py-2 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 text-[11px] font-black backdrop-blur-md">
                        <span className="text-orange-600">📏 {driverDistance.toFixed(1)} KM</span>
                        <span className="text-purple-650 font-black">⏱️ {Math.floor(driverDuration / 60)}H {driverDuration % 60}M</span>
                      </div>
                    )}

                    <div className="flex-1 w-full h-full min-h-[450px] relative">
                      <LeafletMap 
                        pointA={driverPointA} 
                        pointB={driverPointB} 
                        viaStopsCoords={driverStopsList} 
                        routeGeometry={driverRouteGeometry} 
                        onMapClick={handleMapClick}
                      />
                    </div>
                  </div>

                </div>

                {/* Published Return Schedules List */}
                <div className="mt-10">
                  <h3 className="font-serif font-extrabold text-gray-900 text-xl mb-4">Your Published Fleet Return Schedules</h3>
                  {postedRoutes.length === 0 ? (
                    <div className="text-center py-8 text-gray-405 bg-white rounded-3xl border border-gray-100 shadow-sm">
                      <Truck size={36} className="mx-auto mb-2 opacity-20" />
                      <p className="text-xs font-semibold">No empty routes active yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {postedRoutes.map(route => (
                        <div key={route._id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-350">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full ${route.status === 'active' ? 'bg-green-50 text-green-700 border border-green-150' : 'bg-gray-150 text-gray-500'}`}>
                                {route.status}
                              </span>
                              <span className="text-[10px] font-bold text-gray-455">{route.date}</span>
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
                            <p className="text-[11px] text-gray-550 mt-2 font-semibold text-orange-600">Fleet: {route.truckType}</p>
                          </div>
                          <div className="mt-4 border-t border-gray-50 pt-3 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Asking Fare</span>
                              <span className="text-base font-black text-gray-900">₹{route.price.toLocaleString()}</span>
                            </div>
                            {route.status === "active" && (
                              <button onClick={() => handleDeleteRoutePost(route._id)} className="w-full py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors border border-red-100">
                                Cancel Post
                              </button>
                            )}
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
            <div className="p-8 overflow-y-auto h-full max-w-2xl bg-white rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-3xl font-extrabold font-serif mb-6 text-gray-900">Driver Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <span className="text-[11px] text-gray-400 block mb-2 font-medium">⚠️ Keep your name exactly the same as given in your Govt ID card / Driving License.</span>
                  <input 
                    type="text" 
                    value={settingsName} 
                    onChange={e => setSettingsName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                  <input type="email" disabled defaultValue={user?.email} className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed text-sm font-semibold" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Base Location / Route</label>
                  <input 
                    type="text" 
                    value={settingsLocation} 
                    onChange={e => setSettingsLocation(e.target.value)}
                    placeholder="e.g. Mumbai, India" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold" 
                  />
                </div>

                <div className="border-t border-gray-100 my-4 pt-4">
                  <h3 className="font-bold text-gray-900 text-base mb-3">Verification Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Truck Number</label>
                      <input 
                        type="text" 
                        value={settingsTruckNumber} 
                        onChange={e => setSettingsTruckNumber(e.target.value)}
                        placeholder="e.g. MH12AB1234" 
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs uppercase font-semibold" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Driving License Number</label>
                      <input 
                        type="text" 
                        value={settingsLicenseNumber} 
                        onChange={e => setSettingsLicenseNumber(e.target.value)}
                        placeholder="e.g. MH1220180001234" 
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs uppercase font-semibold" 
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-3">
                    <label className="block text-xs font-bold text-gray-700">Upload Driving License (Govt ID card)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) handleOcr(file);
                      }}
                      className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                    />

                    {ocrLoading && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-orange-600">
                        <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
                        <span>{ocrProgress}</span>
                      </div>
                    )}

                    {!ocrLoading && ocrNameMatched !== null && (
                      <div className={`text-xs font-bold p-3 rounded-lg border ${ocrNameMatched ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {ocrNameMatched ? (
                          <span>✅ OCR Match Success: Name matches registered name!</span>
                        ) : (
                          <span>❌ OCR Match Failure: Name in Driving License did not match your registered name. Please update your registered Name at the top to match.</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handleSaveSettings} 
                  disabled={ocrLoading || ocrNameMatched === false}
                  className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md ${
                    (ocrLoading || ocrNameMatched === false) 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                      : 'bg-gray-900 text-white hover:bg-gray-800 shadow-gray-200 cursor-pointer'
                  }`}
                >
                  Save Verification & Profile
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
              <div className="flex flex-1 overflow-hidden h-full">
                {/* Left Column: Conversations List */}
                <div className="w-80 border-r border-gray-100 flex flex-col bg-white overflow-y-auto shrink-0 animate-fade-in">
                  <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">Your Conversations</h3>
                    <select
                      className="text-[10px] border border-gray-200 rounded px-1.5 py-0.5 outline-none bg-white text-gray-500 font-semibold cursor-pointer"
                      onChange={(e) => setChatSortBy(e.target.value)}
                      value={chatSortBy}
                    >
                      <option value="date">📅 Date</option>
                      <option value="name">👤 Name</option>
                    </select>
                  </div>
                  {sortedChatTrips.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs">No active chats found.</div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {sortedChatTrips.map(t => {
                        const isActive = selectedTrip?._id === t._id;
                        return (
                          <button
                            key={t._id}
                            onClick={() => setSelectedTrip(t)}
                            className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex flex-col gap-1.5 ${isActive ? "bg-orange-50/50 border-l-4 border-orange-500" : ""}`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-gray-900 text-sm">{t.userId?.name || "Customer"}</span>
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${t.status === 'completed' ? 'bg-green-150 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {t.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 font-semibold truncate">{t.pickup.split(',')[0]} → {t.dropoff.split(',')[0]}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column: Chat Content */}
                <div className="flex-1 flex flex-col bg-slate-50/50 h-full overflow-hidden">
                  {selectedTrip ? (
                    <>
                      <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center z-10 shrink-0">
                        <div>
                          <h3 className="font-extrabold text-gray-900 text-base">
                            Chat with Customer: {selectedTrip?.userId?.name || "Customer"}
                          </h3>
                          <p className="text-[10px] text-gray-450 font-bold uppercase tracking-wider mt-0.5">{selectedTrip.pickup.split(',')[0]} → {selectedTrip.dropoff.split(',')[0]}</p>
                        </div>
                      </div>

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
                      <p className="text-sm font-semibold">Select a conversation from the left to start chatting</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

        </div>
      </main>
    </div>
  );
}

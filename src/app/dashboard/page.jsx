"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { LayoutDashboard, Truck, CheckCircle, MessageSquare, CreditCard, Settings, Search, Check, CheckCheck, Clock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "ongoing", "past", "chat", "transactions", "settings"
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedInvoiceTrip, setSelectedInvoiceTrip] = useState(null);
  const [selectedDriverProfile, setSelectedDriverProfile] = useState(null);
  
  // Chat specific state
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const messagesEndRef = useRef(null);

  // User state
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(localStorage.getItem("user") || "{}"));

    fetch("/api/trips", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setTrips(data.trips || []);
        setLoading(false);
      });
  }, [router]);

  const ongoingTrips = trips.filter(t => ["pending", "accepted", "running"].includes(t.status));
  const pastTrips = trips.filter(t => ["completed", "cancelled"].includes(t.status));

  const handleDeleteTrip = async (tripId) => {
    if (!confirm("Are you sure you want to cancel this request?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/trips?id=${tripId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Trip request cancelled");
        setTrips(prev => prev.filter(t => t._id !== tripId));
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to cancel trip");
      }
    } catch (err) {
      toast.error("Error cancelling trip");
    }
  };

  // Compute stats for overview
  const totalTrips = trips.length;
  // Calculate a mock "money saved" metric (e.g. 15% of total spent)
  const totalSpent = trips.filter(t => t.status === "completed").reduce((acc, curr) => acc + (curr.price || 0), 0);
  const moneySaved = Math.round(totalSpent * 0.15);
  const activeCount = ongoingTrips.length;

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
      interval = setInterval(() => loadMessages(selectedTrip._id), 3000); // Polling every 3s
    }
    return () => clearInterval(interval);
  }, [activeTab, selectedTrip]);

  const lastMessageCountRef = useRef({});

  // Background message monitoring for notifications
  useEffect(() => {
    if (!ongoingTrips || ongoingTrips.length === 0) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Initialize counts if not set yet
    ongoingTrips.forEach(trip => {
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
      ongoingTrips.forEach(trip => {
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
                          <span>💬</span> New message for trip!
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
                          Reply to Driver 🚛
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
  }, [ongoingTrips, user, activeTab, selectedTrip]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedTrip) return;

    const token = localStorage.getItem("token");
    const sentText = text;
    setText("");

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          tripId: selectedTrip._id,
          text: sentText
        })
      });
      loadMessages(selectedTrip._id);
    } catch (err) {
      console.error(err);
    }
  };

  const submitCustomerReview = async () => {
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
          customerRating: reviewRating,
          customerReview: reviewText
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Review submitted! Rating updated in real-time.");
        
        // Update the selected trip object in local state immediately so it renders as reviewed
        setSelectedTrip(data.trip);
        
        // Also update the trip in the global trips state list so it updates across the dashboard tabs
        setTrips(prevTrips => prevTrips.map(t => t._id === data.trip._id ? data.trip : t));
        
        // Reset review state
        setReviewRating(5);
        setReviewText("");
      } else {
        toast.error("Failed to submit review");
      }
    } catch (err) {
      toast.error("Error submitting review");
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

      <main className="flex-1 pt-28 px-4 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-6 pb-6 md:h-[calc(100vh-7rem)] md:overflow-hidden">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
            <div className="px-4 py-3 mb-2 border-b border-gray-50">
              <p className="text-xs uppercase tracking-widest font-bold text-gray-400">Menu</p>
            </div>
            {[
              { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} /> },
              { id: "ongoing", label: "Ongoing Trips", icon: <Truck size={20} /> },
              { id: "past", label: "Past Trips", icon: <CheckCircle size={20} /> },
              { id: "chat", label: "Messages", icon: <MessageSquare size={20} /> },
              { id: "transactions", label: "Transactions", icon: <CreditCard size={20} /> },
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
              <h2 className="text-3xl font-extrabold font-serif mb-6 text-gray-900">Dashboard Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                      <Truck size={24} />
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium text-sm mb-1">Total Trips</p>
                    <h3 className="text-4xl font-extrabold text-gray-900 font-serif">{totalTrips}</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow md:col-span-2 relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                      <CreditCard size={24} />
                    </div>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Estimated Savings</span>
                  </div>
                  <div className="relative z-10">
                    <p className="text-gray-500 font-medium text-sm mb-1">Money Saved on Logistics</p>
                    <h3 className="text-4xl font-extrabold text-gray-900 font-serif text-green-600">₹{moneySaved.toLocaleString()}</h3>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 text-lg">Active Transports</h3>
                    <button onClick={() => setActiveTab("ongoing")} className="text-orange-500 text-sm font-bold hover:underline">View All</button>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    {ongoingTrips.length > 0 ? (
                      <div className="space-y-4">
                        {ongoingTrips.slice(0, 3).map(trip => (
                          <div key={trip._id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0 font-bold">
                              {trip.driverId ? (
                                <span>{trip.driverId.name ? trip.driverId.name.charAt(0).toUpperCase() : "D"}</span>
                              ) : (
                                <Truck size={18} />
                              )}
                            </div>
                            <div className="flex-1 truncate">
                              <p className="font-bold text-gray-900 text-sm truncate">{trip.pickup} → {trip.dropoff}</p>
                              {trip.viaStops && trip.viaStops.length > 0 && (
                                <p className="text-[10px] text-green-600 font-bold mt-0.5 truncate">Via: {trip.viaStops.join(" → ")}</p>
                              )}
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${trip.status === 'pending' ? 'bg-yellow-100 text-yellow-755 font-bold' : 'bg-green-100 text-green-700 font-bold'}`}>
                                  {trip.status}
                                </span>
                                {trip.driverId && (
                                  <button
                                    onClick={() => setSelectedDriverProfile(trip.driverId)}
                                    className="text-[10px] text-gray-400 font-medium flex items-center gap-1 hover:underline cursor-pointer focus:outline-none"
                                  >
                                    Driver: {trip.driverId.name}
                                    {trip.driverId.truckNumber && trip.driverId.licenseNumber && (
                                      <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-blue-500 text-white" title="Verified Driver">
                                        <Check size={7} strokeWidth={4} />
                                      </span>
                                    )}
                                  </button>
                                )}
                              </div>
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
                      <Search size={24} />
                    </div>
                    <div className="mt-auto">
                      <h3 className="text-2xl font-bold font-serif mb-2">Need a truck?</h3>
                      <p className="text-gray-400 text-sm mb-6 max-w-xs">Book instantly from our verified network of over 10,000+ drivers pan-India.</p>
                      <button 
                        onClick={() => router.push("/startbooking")} 
                        className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                      >
                        Start Booking Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ONGOING TRIPS */}
          {activeTab === "ongoing" && (
            <div className="p-8 overflow-y-auto h-full">
              <h2 className="text-3xl font-extrabold font-serif mb-6 text-gray-900">Ongoing Transportation</h2>
              {ongoingTrips.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No active trips right now.</div>
              ) : (
                <div className="grid gap-4">
                  {ongoingTrips.map(trip => (
                    <div key={trip._id} className="p-5 rounded-2xl border border-gray-100 hover:border-orange-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${trip.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{trip.status}</span>
                          <span className="text-sm font-bold text-gray-400">ID: {trip._id.slice(-6).toUpperCase()}</span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">{trip.pickup} <span className="text-orange-500">→</span> {trip.dropoff}</h3>
                        {trip.viaStops && trip.viaStops.length > 0 && (
                          <p className="text-xs text-green-600 font-bold mt-1">Via: {trip.viaStops.join(" → ")}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">{trip.truckType} · {trip.distance} km</p>
                        {trip.driverId && (
                          <div 
                            onClick={() => setSelectedDriverProfile(trip.driverId)}
                            className="flex items-center gap-2.5 mt-3 pt-3 border-t border-gray-50 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-all"
                            title="Click to view driver profile"
                          >
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-extrabold text-xs flex items-center justify-center border border-orange-200">
                              {trip.driverId.name ? trip.driverId.name.charAt(0).toUpperCase() : "D"}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-gray-900 hover:underline">Driver Assigned: {trip.driverId.name}</span>
                                {trip.driverId.truckNumber && trip.driverId.licenseNumber && (
                                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-500 text-white shadow-sm" title="Verified Driver">
                                    <Check size={8} strokeWidth={4} />
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-450 font-medium">
                                ★ {trip.driverId.rating || "5.0"} rating · {trip.driverId.truckNumber && trip.driverId.licenseNumber ? (
                                  <span className="text-blue-600 font-bold">Verified Driver</span>
                                ) : (
                                  "Verified carrier"
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleOpenChat(trip)} 
                            disabled={trip.status === "pending"}
                            className={`px-4 py-2 font-bold rounded-xl text-sm transition-colors ${trip.status === "pending" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-orange-50 text-orange-600 hover:bg-orange-100"}`}
                          >
                            Chat
                          </button>
                          <button 
                            disabled={trip.status === "pending"}
                            className={`px-4 py-2 font-bold rounded-xl text-sm transition-colors shadow-md ${trip.status === "pending" ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none" : "bg-gray-900 text-white hover:bg-gray-800"}`}
                          >
                            Track Live
                          </button>
                        </div>
                        {trip.status === "pending" && (
                          <button onClick={() => handleDeleteTrip(trip._id)} className="px-4 py-1.5 w-full bg-red-50 text-red-600 font-bold rounded-xl text-xs hover:bg-red-100 transition-colors border border-red-100">
                            Cancel Request
                          </button>
                        )}
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
              <h2 className="text-3xl font-extrabold font-serif mb-6 text-gray-900">Past Transportation</h2>
              {pastTrips.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No past trips found.</div>
              ) : (
                <div className="grid gap-4">
                  {pastTrips.map(trip => (
                    <div key={trip._id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="opacity-70">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${trip.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{trip.status}</span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">{trip.pickup} <span className="text-gray-400">→</span> {trip.dropoff}</h3>
                        {trip.viaStops && trip.viaStops.length > 0 && (
                          <p className="text-xs text-green-600 font-bold mt-1">Via: {trip.viaStops.join(" → ")}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">{new Date(trip.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="font-bold text-gray-900">₹{trip.price}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: TRANSACTIONS */}
          {activeTab === "transactions" && (
            <div className="p-8 overflow-y-auto h-full">
              <h2 className="text-3xl font-extrabold font-serif mb-6 text-gray-900">Past Transactions</h2>
              {trips.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No transactions found.</div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-100">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Date</th>
                        <th className="px-6 py-4 font-semibold">Route</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Amount</th>
                        <th className="px-6 py-4 font-semibold text-center">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {trips.map(trip => (
                        <tr key={trip._id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 text-gray-600">{new Date(trip.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            <div>{trip.pickup} → {trip.dropoff}</div>
                            {trip.viaStops && trip.viaStops.length > 0 && (
                              <div className="text-[10px] text-green-600 font-bold mt-0.5 truncate max-w-[200px]">Via: {trip.viaStops.join(" → ")}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${trip.status === 'completed' ? 'bg-green-100 text-green-700' : trip.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}>{trip.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900">₹{trip.price}</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => setSelectedInvoiceTrip(trip)}
                              className="px-3.5 py-1 bg-orange-50 text-orange-600 hover:bg-orange-100 text-xs font-bold rounded-lg transition-colors border border-orange-100 shadow-sm"
                            >
                              View Bill 📄
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === "settings" && (
            <div className="p-8 overflow-y-auto h-full max-w-2xl">
              <h2 className="text-3xl font-extrabold font-serif mb-6 text-gray-900">Settings</h2>
              
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
                  <label className="block text-sm font-bold text-gray-700 mb-2">Location / Base City</label>
                  <input type="text" defaultValue={user?.location || ""} placeholder="e.g. Mumbai, India" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                </div>

                <button onClick={() => toast.success("Settings saved successfully!")} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-gray-800 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* TAB: CHAT */}
          {activeTab === "chat" && (
            <div className="flex flex-1 overflow-hidden h-full">
              {/* Left Column: Conversations List */}
              <div className="w-80 border-r border-gray-100 flex flex-col bg-white overflow-y-auto shrink-0 animate-fade-in">
                <div className="p-4 border-b border-gray-50">
                  <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">Your Conversations</h3>
                </div>
                {trips.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs">No active chats found.</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {trips.map(t => {
                      const isActive = selectedTrip?._id === t._id;
                      const partnerName = t.driverId?.name || "Driver Assigned";
                      return (
                        <button
                          key={t._id}
                          onClick={() => setSelectedTrip(t)}
                          className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex flex-col gap-1.5 ${isActive ? "bg-orange-50/50 border-l-4 border-orange-500" : ""}`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-gray-900 text-sm">{partnerName}</span>
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
                          Chat with Driver: {selectedTrip?.driverId?.name || "Driver"}
                        </h3>
                        <p className="text-[10px] text-gray-450 font-bold uppercase tracking-wider mt-0.5">{selectedTrip.pickup.split(',')[0]} → {selectedTrip.dropoff.split(',')[0]}</p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10 text-sm bg-white p-4 rounded-xl border border-gray-100 inline-block mx-auto">
                          No messages yet. Send a message to start chatting.
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
                          <h4 className="font-bold text-gray-900 text-sm mt-1">This trip is completed!</h4>
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">The chat session has ended. Share your valuable experience below.</p>
                        </div>

                        {/* Review / Feedback Section */}
                        {selectedTrip.customerRating !== undefined && selectedTrip.customerRating !== null ? (
                          <div className="text-center max-w-xl mx-auto w-full p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                            <p className="text-xs font-black text-emerald-850">🎉 Thank you! Your feedback has been recorded successfully.</p>
                            <div className="flex justify-center items-center gap-1.5 mt-2">
                              <span className="text-xs font-semibold text-gray-600">Your Rating:</span>
                              <span className="text-sm font-black text-amber-500">{"★".repeat(selectedTrip.customerRating)}{"☆".repeat(5 - selectedTrip.customerRating)}</span>
                              <span className="text-xs font-bold text-gray-500">({selectedTrip.customerRating} / 5)</span>
                            </div>
                            {selectedTrip.customerReview && (
                              <p className="text-xs text-gray-500 italic mt-3 bg-white/70 py-2 px-3 rounded-xl border border-emerald-100/50">"{selectedTrip.customerReview}"</p>
                            )}
                          </div>
                        ) : (
                          <div className="max-w-xl mx-auto w-full bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                            <h5 className="font-bold text-gray-800 text-xs uppercase tracking-wide mb-3">Rate your Driver ({selectedTrip.driverId?.name || "Driver"})</h5>
                            
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
                              placeholder="Write a brief review about the driving safety, vehicle condition, and delivery speed..."
                              rows={3}
                              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs mb-3 resize-none font-medium"
                            />

                            <button
                              onClick={submitCustomerReview}
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
          )}

        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-receipt-modal, #print-receipt-modal * {
            visibility: visible;
          }
          #print-receipt-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            height: auto !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
        }
      `}} />

      {/* ── Bill Invoice Printable Modal ── */}
      <AnimatePresence>
        {selectedInvoiceTrip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto"
            id="print-receipt-modal"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="bg-white text-gray-800 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8 relative overflow-hidden font-sans flex flex-col gap-6"
            >
              {/* Receipt top orange border highlight */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-orange-50" style={{ background: "#f97316" }} />
              
              {/* Modal header */}
              <div className="flex justify-between items-start pt-1">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">🚛</span>
                    <span className="font-extrabold text-gray-900 tracking-tight text-xl font-serif">
                      TRUCK<span className="text-orange-500">IT</span>
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 mt-2 font-serif">Booking Invoice</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    Date: {selectedInvoiceTrip.createdAt ? new Date(selectedInvoiceTrip.createdAt).toLocaleString() : new Date().toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedInvoiceTrip(null)}
                  className="text-gray-400 hover:text-gray-600 font-extrabold text-xl p-1 leading-none rounded-lg hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Dotted separator */}
              <div className="border-t border-dashed border-gray-200" />

              {/* Trip details */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-400 font-medium">Pickup Location</span>
                  <span className="text-gray-950 font-bold text-right max-w-[70%] truncate">{selectedInvoiceTrip.pickup}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-400 font-medium">Dropoff Location</span>
                  <span className="text-gray-950 font-bold text-right max-w-[70%] truncate">{selectedInvoiceTrip.dropoff}</span>
                </div>
                {selectedInvoiceTrip.viaStops && selectedInvoiceTrip.viaStops.length > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-400 font-medium">Via Stops</span>
                    <span className="text-green-600 font-bold text-right max-w-[70%] truncate">{selectedInvoiceTrip.viaStops.join(" → ")}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-400 font-medium">Total Distance</span>
                  <span className="text-gray-950 font-bold">{selectedInvoiceTrip.distance ? selectedInvoiceTrip.distance.toFixed(1) : 0} km</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-400 font-medium">Vehicle Selected</span>
                  <span className="text-gray-950 font-bold">{selectedInvoiceTrip.truckType}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm items-center">
                  <span className="text-gray-400 font-medium">Road Permit / E-Way</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">GENERATED (ACTIVE)</span>
                </div>
              </div>

              {/* Dotted separator */}
              <div className="border-t border-dashed border-gray-200" />

              {/* Pricing breakdown */}
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-400">Base Freight Charge</span>
                  <span className="text-gray-800 font-semibold">₹{Math.round(selectedInvoiceTrip.price * 0.74).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-400">Road Permit / Toll Taxes</span>
                  <span className="text-gray-800 font-semibold">₹{Math.round(selectedInvoiceTrip.price * 0.08).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-400">CGST (9%)</span>
                  <span className="text-gray-800 font-semibold">₹{Math.round(selectedInvoiceTrip.price * 0.09).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-400">SGST (9%)</span>
                  <span className="text-gray-800 font-semibold">₹{Math.round(selectedInvoiceTrip.price * 0.09).toLocaleString()}</span>
                </div>
                <div className="border-t border-dashed border-gray-200 my-1" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-950 font-black text-sm uppercase tracking-wide">Grand Total Paid</span>
                  <span className="text-orange-600 font-black text-xl">₹{selectedInvoiceTrip.price?.toLocaleString()}</span>
                </div>
              </div>

              {/* Barcode representation */}
              <div className="flex flex-col items-center mt-1">
                <div 
                  className="h-10 w-full max-w-[240px]" 
                  style={{
                    background: "repeating-linear-gradient(90deg, #111827, #111827 2px, transparent 2px, transparent 5px, #111827 5px, #111827 8px, transparent 8px, transparent 10px)",
                    opacity: 0.85
                  }} 
                />
                <span className="text-[10px] text-gray-450 font-mono tracking-[0.25em] mt-1.5">
                  TRK-{selectedInvoiceTrip._id ? selectedInvoiceTrip._id.slice(-6).toUpperCase() : "849203"}
                </span>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-4 mt-1">
                <button
                  onClick={() => window.print()}
                  className="py-3 px-4 rounded-xl border border-gray-200 hover:border-gray-300 text-gray-700 font-bold text-sm bg-white hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  🖨️ Print Bill
                </button>
                <button
                  onClick={() => setSelectedInvoiceTrip(null)}
                  className="py-3 px-4 rounded-xl text-white font-bold text-sm bg-orange-500 hover:bg-orange-600 transition-colors shadow-md shadow-orange-200 flex items-center justify-center"
                >
                  Close
                </button>
             </div>
            </motion.div>
          </motion.div>
        )}

        {selectedDriverProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setSelectedDriverProfile(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 flex flex-col relative overflow-hidden"
            >
              {/* Header profile pattern */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-orange-400 to-orange-500 z-0"></div>
              
              <div className="relative z-10 flex flex-col items-center mt-8">
                <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg">
                  <div className="w-full h-full rounded-full bg-orange-100 text-orange-600 text-2xl font-black flex items-center justify-center border border-orange-200">
                    {selectedDriverProfile.name ? selectedDriverProfile.name.charAt(0).toUpperCase() : "D"}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3">
                  <h3 className="font-extrabold text-xl text-gray-900">{selectedDriverProfile.name}</h3>
                  {selectedDriverProfile.truckNumber && selectedDriverProfile.licenseNumber && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white shadow-md" title="Verified Driver">
                      <Check size={10} strokeWidth={4} />
                    </span>
                  )}
                </div>

                {selectedDriverProfile.truckNumber && selectedDriverProfile.licenseNumber ? (
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full mt-1 flex items-center gap-1">
                    Verified Driver Partner
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-0.5 rounded-full mt-1">
                    Carrier Partner
                  </span>
                )}

                {/* Rating display */}
                <div className="flex items-center gap-2 mt-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 w-full justify-around">
                  <div className="text-center">
                    <span className="text-xs text-gray-400 font-bold block">Rating</span>
                    <span className="font-black text-sm text-gray-900">★ {selectedDriverProfile.rating ? selectedDriverProfile.rating.toFixed(1) : "5.0"}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200"></div>
                  <div className="text-center">
                    <span className="text-xs text-gray-400 font-bold block">Trips Done</span>
                    <span className="font-black text-sm text-gray-900">{selectedDriverProfile.tripsDone || 0}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200"></div>
                  <div className="text-center">
                    <span className="text-xs text-gray-400 font-bold block">Reviews</span>
                    <span className="font-black text-sm text-gray-900">{selectedDriverProfile.reviewsCount || 0}</span>
                  </div>
                </div>

                <div className="w-full space-y-3 mt-6 border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-wider">Truck Reg. Number</span>
                    <span className="font-black text-gray-900 bg-slate-100 px-2.5 py-1 rounded-lg uppercase">{selectedDriverProfile.truckNumber || "Not Provided"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-wider">Govt Driving License</span>
                    <span className="font-black text-gray-950 bg-slate-100 px-2.5 py-1 rounded-lg uppercase">{selectedDriverProfile.licenseNumber || "Not Provided"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-wider">Current Location</span>
                    <span className="font-black text-gray-900">{selectedDriverProfile.location || "On Route"}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDriverProfile(null)}
                  className="w-full mt-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-colors shadow-md shadow-slate-150"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

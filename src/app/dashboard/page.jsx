"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ongoing"); // "ongoing", "past", "chat", "transactions", "settings"
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  // Chat specific state
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
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

      <main className="flex-1 pt-24 px-4 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-6 pb-6 h-screen overflow-hidden">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
            <div className="px-4 py-3 mb-2 border-b border-gray-50">
              <p className="text-xs uppercase tracking-widest font-bold text-gray-400">Menu</p>
            </div>
            {[
              { id: "ongoing", label: "Ongoing Trips", icon: "🚚" },
              { id: "past", label: "Past Trips", icon: "✅" },
              { id: "chat", label: "Messages", icon: "💬" },
              { id: "transactions", label: "Transactions", icon: "💳" },
              { id: "settings", label: "Settings", icon: "⚙️" },
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
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
          
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
                          <span className="bg-yellow-100 text-yellow-700 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full">{trip.status}</span>
                          <span className="text-sm font-bold text-gray-400">ID: {trip._id.slice(-6).toUpperCase()}</span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">{trip.pickup} <span className="text-orange-500">→</span> {trip.dropoff}</h3>
                        <p className="text-sm text-gray-500 mt-1">{trip.truckType} · {trip.distance} km</p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleOpenChat(trip)} className="px-4 py-2 bg-orange-50 text-orange-600 font-bold rounded-xl text-sm hover:bg-orange-100 transition-colors">
                          Chat
                        </button>
                        <button className="px-4 py-2 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-gray-800 transition-colors shadow-md">
                          Track Live
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {trips.map(trip => (
                        <tr key={trip._id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 text-gray-600">{new Date(trip.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{trip.pickup} → {trip.dropoff}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-gray-500 uppercase">{trip.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900">₹{trip.price}</td>
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
            <div className="flex flex-col h-full bg-slate-50">
              {/* Trip selector header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center z-10 shrink-0">
                <div>
                  <h3 className="font-bold text-gray-900 font-serif text-lg">
                    {user?.role === "driver" ? "Customer Support / Chat" : "Driver Chat"}
                  </h3>
                  <div className="flex gap-2 mt-1">
                    <select 
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none"
                      onChange={(e) => setSelectedTrip(trips.find(t => t._id === e.target.value))}
                      value={selectedTrip?._id || ""}
                    >
                      <option value="" disabled>Select a trip</option>
                      {trips.map(t => (
                        <option key={t._id} value={t._id}>{t.pickup} → {t.dropoff}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {selectedTrip ? (
                <>
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-400 mt-10 text-sm bg-white p-4 rounded-xl border border-gray-100 inline-block mx-auto">
                        No messages yet. Send a message to start chatting.
                      </div>
                    ) : (
                      messages.map(msg => {
                        const isMe = msg.senderId === user?.id;
                        return (
                          <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-orange-500 text-white rounded-br-none shadow-orange-200 shadow-md" : "bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm"}`}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Chat Input */}
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
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <div className="text-5xl mb-4">💬</div>
                  <p>Select a trip from the dropdown above to start chatting</p>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

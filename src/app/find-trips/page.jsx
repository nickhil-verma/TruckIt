"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Navbar from "@/components/Navbar";

// --- Dummy Data Helpers ---
const cities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur"];
const truckTypes = [
  { type: "Mini Truck", icon: "🛻", rate: 12, capacity: "1 Ton" },
  { type: "Medium Truck", icon: "🚚", rate: 18, capacity: "3 Tons" },
  { type: "Heavy Truck", icon: "🚛", rate: 28, capacity: "10 Tons" },
];
const drivers = [
  { name: "Rajesh Kumar", experience: "12 years", rating: 4.8, bio: "Reliable and punctual. Specialized in long-distance heavy hauling.", avatar: "RK" },
  { name: "Suresh Singh", experience: "8 years", rating: 4.6, bio: "Expert in city navigation and quick deliveries.", avatar: "SS" },
  { name: "Amit Patel", experience: "15 years", rating: 4.9, bio: "Safety first. Zero accidents in 15 years of service.", avatar: "AP" },
  { name: "Vikram Rathore", experience: "5 years", rating: 4.7, bio: "Efficient and tech-savvy. Always on time.", avatar: "VR" },
  { name: "Manoj Yadav", experience: "10 years", rating: 4.5, bio: "Experienced with fragile cargo and special handling.", avatar: "MY" },
];

const generateRandomTrucks = (count = 6) => {
  return Array.from({ length: count }).map((_, i) => {
    const typeObj = truckTypes[Math.floor(Math.random() * truckTypes.length)];
    const driver = drivers[Math.floor(Math.random() * drivers.length)];
    const from = cities[Math.floor(Math.random() * cities.length)];
    let to = cities[Math.floor(Math.random() * cities.length)];
    while (to === from) to = cities[Math.floor(Math.random() * cities.length)];

    return {
      id: `TRK-${1000 + i}`,
      ...typeObj,
      driver,
      from,
      to,
      status: Math.random() > 0.5 ? "Running" : "Available",
      progress: Math.floor(Math.random() * 100),
      plate: `MH ${Math.floor(Math.random() * 99)} AB ${Math.floor(Math.random() * 9999)}`,
    };
  });
};

function FadeUp({ children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function FindTrips() {
  const [trucks, setTrucks] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    setTrucks(generateRandomTrucks(8));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans pb-20">
      <Navbar />

      <main className="pt-32 px-4 max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <FadeUp>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold tracking-widest text-orange-500 uppercase mb-4">
              Live Fleet Status
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold font-serif tracking-tight text-gray-900 mb-4">
              Find <span className="text-orange-500 font-cursive italic font-normal">Active</span> Trips
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Real-time view of our running fleet across India. Connect with verified drivers and track active logistics movements.
            </p>
          </FadeUp>
        </header>

        {/* Truck Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trucks.map((truck, idx) => (
            <FadeUp key={truck.id} delay={idx * 0.05}>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                {/* Card Header */}
                <div className="p-6 border-b border-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        {truck.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{truck.type}</h3>
                        <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">{truck.plate}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      truck.status === "Running" ? "bg-green-50 text-green-600 border border-green-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                    }`}>
                      ● {truck.status}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">From</p>
                        <p className="font-semibold text-gray-800">{truck.from}</p>
                      </div>
                      <div className="flex-1 px-4 relative flex flex-col items-center">
                        <div className="w-full h-px bg-gray-100 relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${truck.progress}%` }}
                            className="absolute top-0 left-0 h-px bg-orange-400"
                          />
                          <motion.div 
                            animate={{ left: `${truck.progress}%` }}
                            className="absolute -top-1 h-2 w-2 rounded-full bg-orange-500 shadow-sm shadow-orange-200"
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">To</p>
                        <p className="font-semibold text-gray-800">{truck.to}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-gray-50/50 p-5 flex items-center justify-between">
                  <div 
                    className="flex items-center gap-3 cursor-pointer group/driver"
                    onClick={() => setSelectedDriver(truck.driver)}
                  >
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 border-2 border-white shadow-sm">
                      {truck.driver.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 group-hover/driver:text-orange-600 transition-colors">{truck.driver.name}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500 text-[10px]">★</span>
                        <span className="text-[10px] text-gray-500 font-medium">{truck.driver.rating}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedDriver(truck.driver)}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 underline-offset-4 hover:underline"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </main>

      {/* Driver Profile Modal */}
      <AnimatePresence>
        {selectedDriver && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDriver(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-600 p-6 flex justify-end">
                <button 
                  onClick={() => setSelectedDriver(null)}
                  className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              
              <div className="px-8 pb-10 -mt-12">
                <div className="relative mb-6">
                  <div className="h-24 w-24 rounded-3xl bg-white p-1.5 shadow-xl inline-block">
                    <div className="h-full w-full rounded-2xl bg-orange-50 flex items-center justify-center text-3xl font-bold text-orange-600">
                      {selectedDriver.avatar}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 font-serif">{selectedDriver.name}</h2>
                    <p className="text-orange-500 font-semibold text-sm">Professional Truck Driver</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 mb-1">
                      <span className="text-yellow-400 text-lg">★</span>
                      <span className="text-xl font-bold text-gray-900">{selectedDriver.rating}</span>
                    </div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Driver Rating</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Experience</p>
                    <p className="font-bold text-gray-900">{selectedDriver.experience}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Trips Done</p>
                    <p className="font-bold text-gray-900">450+</p>
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-2">Driver Bio</p>
                  <p className="text-gray-600 leading-relaxed italic">
                    "{selectedDriver.bio}"
                  </p>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors">
                    Hire Driver
                  </button>
                  <button className="flex-1 border border-gray-200 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-colors">
                    Contact Info
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

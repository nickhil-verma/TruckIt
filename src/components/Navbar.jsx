"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    
    // Check auth state
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.reload();
  };

  const links = [
    { name: "Features", href: "/#features" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Find Trips", href: "/find-trips" },
    { name: "Fleet", href: "/#fleet" },
    { name: "Testimonials", href: "/#testimonials" },
    { name: "FAQ", href: "/#faq" },
  ];

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 rounded-2xl transition-all duration-300 ${
        scrolled
          ? "bg-white/90 shadow-lg shadow-gray-200/60 backdrop-blur-md border border-gray-100"
          : "bg-white/70 backdrop-blur-sm border border-gray-100/60"
      }`}
    >
      <div className="flex items-center justify-between px-5 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img 
            src="/LOGO.png" 
            alt="TruckIt Logo" 
            className="h-9 w-auto object-contain"
            style={{ mixBlendMode: "multiply" }}
          />
          <span className="font-extrabold text-gray-900 tracking-tight text-lg font-serif">
            TRUCK<span className="text-orange-500">IT</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.name}
              href={l.href}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200 font-medium"
            >
              {l.name}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {mounted ? (
            user ? (
              <div className="relative">
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 border-2 border-white shadow-sm hover:scale-105 transition-transform"
                >
                  {(user.name || user.role || "U").substring(0, 2).toUpperCase()}
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="p-2 flex flex-col">
                        <Link href={user.role === "driver" ? "/driver-dashboard" : "/dashboard"} className="px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-colors text-left font-medium" onClick={() => setDropdownOpen(false)}>
                          {user.role === "driver" ? "Driver Dashboard" : "Dashboard"}
                        </Link>
                        <button onClick={handleLogout} className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left mt-1 font-medium">
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
                Sign In
              </Link>
            )
          ) : (
            <div className="w-24 h-8"></div>
          )}
          {(!mounted || !user || user.role !== "driver") && (
            <Link
              href="/startbooking"
              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-200 hover:bg-orange-600 transition-colors duration-200"
            >
              Start Booking →
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-500 text-xl"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-gray-100 px-5 pb-5 flex flex-col gap-1"
          >
            {links.map((l) => (
              <Link
                key={l.name}
                href={l.href}
                className="block py-2 text-sm text-gray-600 hover:text-orange-500 font-semibold"
                onClick={() => setMobileOpen(false)}
              >
                {l.name}
              </Link>
            ))}
            
            {mounted && user ? (
              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
                <div className="flex items-center gap-3 px-1 py-1">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 border border-orange-200">
                    {(user.name || user.role || "U").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <Link
                  href={user.role === "driver" ? "/driver-dashboard" : "/dashboard"}
                  className="mt-1 block rounded-xl bg-orange-50 px-4 py-2.5 text-center text-sm font-bold text-orange-600 hover:bg-orange-100 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {user.role === "driver" ? "Driver Dashboard" : "Dashboard"}
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="block w-full rounded-xl bg-red-50 hover:bg-red-100 px-4 py-2.5 text-center text-sm font-bold text-red-600 transition-colors border border-red-100"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
                <Link
                  href="/login"
                  className="block rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 py-2.5 text-center text-sm font-bold text-gray-700 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            )}

            {mounted && (!user || user.role !== "driver") && (
              <Link
                href="/startbooking"
                className="mt-2 block rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-center text-sm font-bold text-white shadow-md shadow-orange-200 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Start Booking →
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

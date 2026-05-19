"use client"
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ─────────────────────────────────────────────
   Tailwind + shadcn assumed available.
   Google Font loaded via <style> tag injection.
 ───────────────────────────────────────────── */

// ── Fade-in wrapper used throughout ──────────
function FadeUp({ children, className = "" }) {
  return (
    <div className={`gsap-item opacity-0 ${className}`}>
      {children}
    </div>
  );
}

// ── Section label pill ────────────────────────
function Pill({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold tracking-widest text-orange-500 uppercase">
      {children}
    </span>
  );
}

// ── Stat card ─────────────────────────────────
function StatCard({ value, label, icon }) {
  return (
    <FadeUp>
      <div className="flex flex-col items-center gap-1 px-8 py-6">
        <span className="text-3xl mb-1">{icon}</span>
        <span className="text-4xl font-bold text-gray-900 tracking-tight">{value}</span>
        <span className="text-sm text-gray-400 text-center">{label}</span>
      </div>
    </FadeUp>
  );
}

// ── Feature card ──────────────────────────────
function FeatureCard({ icon, title, desc, delay }) {
  return (
    <FadeUp delay={delay}>
      <div className="group rounded-2xl border border-gray-100 bg-white p-7 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl">
          {icon}
        </div>
        <h3 className="mb-2 text-base font-semibold text-gray-900">{title}</h3>
        <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
      </div>
    </FadeUp>
  );
}

// ── How it works step ─────────────────────────
function Step({ number, title, desc, delay }) {
  return (
    <FadeUp delay={delay}>
      <div className="flex gap-5">
        <div className="flex-shrink-0 mt-0.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white shadow-md shadow-orange-200">
            {number}
          </div>
        </div>
        <div>
          <h4 className="mb-1 font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
        </div>
      </div>
    </FadeUp>
  );
}

// ── Truck type card ───────────────────────────
function TruckTypeCard({ emoji, name, capacity, rate, best, delay }) {
  return (
    <FadeUp delay={delay}>
      <div className="relative rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm hover:border-orange-200 hover:shadow-md transition-all duration-300">
        {best && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-0.5 text-xs font-semibold text-white shadow">
            Most Popular
          </span>
        )}
        <div className="mb-3 text-5xl">{emoji}</div>
        <h3 className="mb-0.5 font-semibold text-gray-900">{name}</h3>
        <p className="mb-4 text-sm text-gray-400">{capacity}</p>
        <div className="border-t border-gray-100 pt-4">
          <span className="text-2xl font-bold text-gray-900">₹{rate}</span>
          <span className="text-sm text-gray-400">/km</span>
        </div>
      </div>
    </FadeUp>
  );
}

// ── Testimonial card ──────────────────────────
function TestimonialCard({ name, role, avatar, quote, rating, delay }) {
  return (
    <FadeUp delay={delay}>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm h-full flex flex-col gap-4">
        <div className="flex gap-1">
          {Array.from({ length: rating }).map((_, i) => (
            <span key={i} className="text-orange-400 text-sm">★</span>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-gray-600 flex-1">"{quote}"</p>
        <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
          <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center text-base font-bold text-orange-600">
            {avatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{name}</p>
            <p className="text-xs text-gray-400">{role}</p>
          </div>
        </div>
      </div>
    </FadeUp>
  );
}

// ── FAQ Item ──────────────────────────────────
function FAQItem({ q, a, delay }) {
  const [open, setOpen] = useState(false);
  return (
    <FadeUp delay={delay}>
      <div
        className="border-b border-gray-100 py-5 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-gray-900">{q}</span>
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 text-orange-500 text-xl font-light leading-none"
          >
            +
          </motion.span>
        </div>
        <AnimatePresence>
          {open && (
            <motion.p
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden text-sm text-gray-500 mt-3 leading-relaxed"
            >
              {a}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </FadeUp>
  );
}

import Navbar from "@/components/Navbar";

// ── Main Landing Page ─────────────────────────
export default function TruckItLanding() {
  const heroRef = useRef(null);
  const landingContainerRef = useRef(null);
  const pinSectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useGSAP(() => {
    // 0. Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tickerCb = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCb);
    gsap.ticker.lagSmoothing(0);

    // 1. Hero Entrance Animations
    gsap.fromTo(".gsap-hero-el",
      { y: 35, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.85, stagger: 0.12, ease: "power3.out" }
    );

    // 2. Pinned Showcase ScrollTrigger Animation
    const pinSection = pinSectionRef.current;
    if (pinSection) {
      const pinTl = gsap.timeline({
        scrollTrigger: {
          trigger: pinSection,
          start: "top top",      // pin when top reaches top of viewport
          end: "+=220%",         // keep pinned longer to accommodate immersive changes
          scrub: 1,
          pin: true,             // pin the section!
          anticipatePin: 1,
          onEnter: () => {
            gsap.to(".gsap-navbar", { top: "-100px", opacity: 0, duration: 0.4, ease: "power2.out" });
          },
          onLeave: () => {
            gsap.to(".gsap-navbar", { top: "1rem", opacity: 1, duration: 0.4, ease: "power2.out" });
          },
          onEnterBack: () => {
            gsap.to(".gsap-navbar", { top: "-100px", opacity: 0, duration: 0.4, ease: "power2.out" });
          },
          onLeaveBack: () => {
            gsap.to(".gsap-navbar", { top: "1rem", opacity: 1, duration: 0.4, ease: "power2.out" });
          }
        }
      });

      // A. Turn section theme to a beautiful dark pitch-black
      pinTl.to(".gsap-showcase-section", {
        backgroundColor: "#000000", // sleek immersive pure pitch-black theme
        duration: 0.6,
        ease: "power2.out"
      }, 0)
        .to(".gsap-showcase-title", {
          color: "#ffffff",
          duration: 0.6,
        }, 0)
        .to(".gsap-showcase-desc", {
          color: "#94a3b8", // slate-400
          duration: 0.6,
        }, 0)
        .to(".gsap-showcase-pill", {
          backgroundColor: "#1e293b", // slate-800
          borderColor: "#334155", // slate-700
          duration: 0.6,
        }, 0)
        // Transition all list headers immediately to white so they are visible
        .to([".gsap-detail-item-header-1", ".gsap-detail-item-header-2", ".gsap-detail-item-header-3"], {
          color: "#ffffff",
          duration: 0.5,
        }, 0)
        // Transition all list bodies immediately to light grey so they are visible
        .to([".gsap-detail-item-body-1", ".gsap-detail-item-body-2", ".gsap-detail-item-body-3"], {
          color: "#cbd5e1",
          duration: 0.5,
        }, 0)
        .fromTo(".gsap-ui-card",
          { scale: 0.95, y: 30 },
          { scale: 1, y: 0, duration: 0.8, ease: "power2.out" },
          0
        );

      // B. Transition from Text 1 to Text 2 active (cross-fade image 1 to 2)
      pinTl.to(".gsap-detail-item-1", {
        opacity: 0.2,
        borderColor: "#334155", // slate-700
        duration: 0.6,
        ease: "power1.inOut"
      }, "+=0.4")
        .to(".gsap-detail-item-2", {
          opacity: 1,
          borderColor: "#f97316", // orange-500
          duration: 0.6,
          ease: "power1.inOut"
        }, "<")
        .to(".gsap-detail-item-header-2", {
          color: "#ffffff",
          duration: 0.3,
        }, "<")
        .to(".gsap-detail-item-body-2", {
          color: "#cbd5e1",
          duration: 0.3,
        }, "<")
        .to(".gsap-showcase-img-1", {
          opacity: 0,
          duration: 0.6,
          ease: "power1.inOut"
        }, "<")
        .to(".gsap-showcase-img-2", {
          opacity: 1,
          duration: 0.6,
          ease: "power1.inOut"
        }, "<");

      // C. Transition from Text 2 to Text 3 active (cross-fade image 2 to 3)
      pinTl.to(".gsap-detail-item-2", {
        opacity: 0.2,
        borderColor: "#334155",
        duration: 0.6,
        ease: "power1.inOut"
      }, "+=0.4")
        .to(".gsap-detail-item-3", {
          opacity: 1,
          borderColor: "#f97316",
          duration: 0.6,
          ease: "power1.inOut"
        }, "<")
        .to(".gsap-detail-item-header-3", {
          color: "#ffffff",
          duration: 0.3,
        }, "<")
        .to(".gsap-detail-item-body-3", {
          color: "#cbd5e1",
          duration: 0.3,
        }, "<")
        .to(".gsap-showcase-img-2", {
          opacity: 0,
          duration: 0.6,
          ease: "power1.inOut"
        }, "<")
        .to(".gsap-showcase-img-3", {
          opacity: 1,
          duration: 0.6,
          ease: "power1.inOut"
        }, "<");

      // D. Smooth exit transition back to light grey theme before unpinning!
      pinTl.to(".gsap-showcase-section", {
        backgroundColor: "#f9fafc", // original light grey-50 bg
        duration: 0.6,
        ease: "power2.inOut"
      }, "+=0.4")
        .to(".gsap-showcase-title", {
          color: "#111827", // gray-900
          duration: 0.6,
        }, "<")
        .to(".gsap-showcase-desc", {
          color: "#6b7280", // gray-500
          duration: 0.6,
        }, "<")
        .to(".gsap-showcase-pill", {
          backgroundColor: "#fff7ed", // orange-50
          borderColor: "#fed7aa", // orange-200
          duration: 0.6,
        }, "<")
        .to(".gsap-detail-item-header-3", {
          color: "#111827", // gray-900
          duration: 0.4,
        }, "<")
        .to(".gsap-detail-item-body-3", {
          color: "#6b7280", // gray-500
          duration: 0.4,
        }, "<")
        .to([".gsap-detail-item-header-1", ".gsap-detail-item-header-2"], {
          color: "#111827",
          duration: 0.4,
        }, "<")
        .to([".gsap-detail-item-body-1", ".gsap-detail-item-body-2"], {
          color: "#6b7280",
          duration: 0.4,
        }, "<")
        .to([".gsap-detail-item-1", ".gsap-detail-item-2"], {
          borderColor: "#e5e7eb", // original border-gray-200
          duration: 0.6,
        }, "<")
        .to(".gsap-showcase-img-3", {
          opacity: 0,
          duration: 0.6,
          ease: "power2.inOut"
        }, "<")
        .to(".gsap-showcase-img-1", {
          opacity: 1,
          duration: 0.6,
          ease: "power2.inOut"
        }, "<");
    }

    // 3. Sections ScrollTrigger Animations
    const sections = gsap.utils.toArray(".gsap-section");
    sections.forEach((section) => {
      const items = section.querySelectorAll(".gsap-item");
      if (items.length > 0) {
        gsap.fromTo(items,
          { y: 40, opacity: 0 },
          {
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              toggleActions: "play none none none",
            },
            y: 0,
            opacity: 1,
            duration: 0.75,
            stagger: 0.08,
            ease: "power2.out",
          }
        );
      }
    });

    return () => {
      gsap.ticker.remove(tickerCb);
      lenis.destroy();
    };
  }, { scope: landingContainerRef });

  return (
    <>

      <div ref={landingContainerRef} className="bg-white text-gray-900 antialiased overflow-x-hidden">
        <Navbar />

        {/* ── HERO ─────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-32 pb-16 overflow-hidden"
        >
          {/* Subtle grid background */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          {/* Glow blob */}
          <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-orange-100 opacity-60 blur-3xl" />

          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto"
          >
            <div className="gsap-hero-el opacity-0">
              <Pill>🚛 India's Smartest Freight Platform</Pill>
            </div>

            <h1 className="gsap-hero-el opacity-0 mt-6 text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.05] text-gray-900 font-serif">
              Move anything,
              <br />
              <span className="text-orange-500 font-cursive italic font-normal text-6xl sm:text-7xl md:text-9xl">anywhere.</span>
            </h1>

            <p className="gsap-hero-el opacity-0 mt-6 max-w-xl text-base sm:text-lg text-gray-500 leading-relaxed">
              Book verified trucks in under 60 seconds. Real-time tracking, transparent pricing, and zero hidden charges — from mini pickups to heavy-haul giants.
            </p>

            <div className="gsap-hero-el opacity-0 mt-8 flex flex-col sm:flex-row items-center gap-3">
              <a
                href="/startbooking"
                className="rounded-2xl bg-orange-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-200 hover:bg-orange-600 hover:shadow-orange-300 transition-all duration-200"
              >
                Start Booking — It's Free →
              </a>
              <a
                href="#how-it-works"
                className="rounded-2xl border border-gray-200 bg-white px-7 py-3.5 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-all duration-200"
              >
                See How It Works
              </a>
            </div>

            <p className="gsap-hero-el opacity-0 mt-5 text-xs text-gray-400">
              ✓ No sign-up fee &nbsp;·&nbsp; ✓ Verified drivers &nbsp;·&nbsp; ✓ 24/7 support
            </p>
          </motion.div>

        </section>

        {/* ── PINNED SHOWCASE ──────────────────── */}
        <section ref={pinSectionRef} className="gsap-showcase-section relative w-full min-h-screen bg-gray-50 flex items-center justify-center py-20 px-4 overflow-hidden border-b border-gray-100">
          <div className="mx-auto max-w-6xl w-full grid grid-cols-1 md:grid-cols-12 gap-12 items-center">

            {/* The Booking UI Card itself (pinned on the left/center) */}
            <div className="md:col-span-7 flex justify-center w-full">
              <div className="gsap-ui-card w-full max-w-2xl rounded-3xl border border-gray-100 bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] hover:shadow-[0_30px_70px_-10px_rgba(249,115,22,0.15)] transition-shadow duration-500 overflow-hidden">
                {/* Mock booking UI browser top bar */}
                <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between bg-white/80 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-300" />
                    <div className="h-3 w-3 rounded-full bg-yellow-300" />
                    <div className="h-3 w-3 rounded-full bg-green-300" />
                    <span className="ml-3 text-xs text-gray-400 font-mono">truckit.app/book</span>
                  </div>
                  <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    ⚡ Live Booking System
                  </span>
                </div>
                <div className="relative w-full overflow-hidden">
                  <img
                    src="/UI.png"
                    alt="TruckIt Booking Interface - Route Selection"
                    className="gsap-showcase-img-1 w-full h-auto object-cover"
                  />
                  <img
                    src="/UI2.png"
                    alt="TruckIt Booking Interface - Fleet Selection"
                    className="gsap-showcase-img-2 absolute inset-0 w-full h-full object-cover opacity-0"
                  />
                  <img
                    src="/UI3.png"
                    alt="TruckIt Booking Interface - Transit Hubs"
                    className="gsap-showcase-img-3 absolute inset-0 w-full h-full object-cover opacity-0"
                  />
                </div>
              </div>
            </div>

            {/* UI Feature Details Card (scrolled on the right) */}
            <div className="md:col-span-5 flex flex-col gap-8 text-left relative min-h-[350px]">

              <div className="space-y-2">
                <span className="gsap-showcase-pill inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold tracking-widest text-orange-500 uppercase w-max">
                  Interactive Showcase
                </span>
                <h3 className="gsap-showcase-title text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 font-serif leading-tight">
                  Experience the next-gen booking interface.
                </h3>
                <p className="gsap-showcase-desc text-gray-500 text-sm leading-relaxed pt-2">
                  Our intuitive platform matches you with the ideal transport provider in seconds. With zero configuration, watch live routes calculate instantly.
                </p>
              </div>

              {/* The Text Cards that will be scrolled/revealed sequentially */}
              <div className="relative flex-1">

                {/* Detail 1 */}
                <div className="gsap-detail-item-1 space-y-2 border-l-2 border-orange-500 pl-4 py-1">
                  <h4 className="gsap-detail-item-header-1 font-bold text-gray-900 text-lg">01 · Smart Route Geocoding</h4>
                  <p className="gsap-detail-item-body-1 text-gray-500 text-sm leading-relaxed">
                    Type address snippets and let our lightning-fast geocoding parse exact longitudes/latitudes instantly.
                  </p>
                </div>

                {/* Detail 2 */}
                <div className="gsap-detail-item-2 space-y-2 border-l-2 border-gray-200 pl-4 py-1 opacity-20 mt-6">
                  <h4 className="gsap-detail-item-header-2 font-bold text-gray-900 text-lg">02 · Dynamic Fleet Pricing</h4>
                  <p className="gsap-detail-item-body-2 text-gray-500 text-sm leading-relaxed">
                    Instantly compare mini, medium, and heavy-haul truck configurations with real-time route calculations.
                  </p>
                </div>

                {/* Detail 3 */}
                <div className="gsap-detail-item-3 space-y-2 border-l-2 border-gray-200 pl-4 py-1 opacity-20 mt-6">
                  <h4 className="gsap-detail-item-header-3 font-bold text-gray-900 text-lg">03 · Live Transit Stops</h4>
                  <p className="gsap-detail-item-body-3 text-gray-500 text-sm leading-relaxed">
                    Add multiple loading/unloading hubs along your journey and preview the total distance dynamically.
                  </p>
                </div>

              </div>

            </div>

          </div>
        </section>

        {/* ── STATS ────────────────────────────── */}
        <section className="border-y border-gray-100 bg-gray-50/50 gsap-section">
          <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
            <StatCard value="50,000+" label="Deliveries completed" icon="📦" />
            <StatCard value="1,200+" label="Verified truck partners" icon="🚛" />
            <StatCard value="4.9★" label="Average driver rating" icon="⭐" />
            <StatCard value="28" label="States covered" icon="🗺️" />
          </div>
        </section>

        {/* ── GROUND INSIGHTS GALLERY ── */}
        <section id="ground-insights" className="py-24 px-4 bg-white border-b border-gray-100 gsap-section">
          <div className="mx-auto max-w-5xl">
            <FadeUp className="flex flex-col items-center text-center mb-14">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-orange-600 bg-orange-50 px-3.5 py-1 rounded-full border border-orange-100">
                  Field Research & Market Insights
                </span>
              </div>
              <h2 className="text-4xl font-extrabold text-gray-900 font-serif">
                Designed on the Road, for the Road
              </h2>
              <p className="text-sm text-gray-500 mt-3 max-w-xl mx-auto leading-relaxed">
                We spend hours at highways and transport hubs talking to driver partners to build a platform that solves real-world logistics challenges.
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch mt-8 text-left">
              {/* Landscape Image - Interviewing on the Ground */}
              <div className="md:col-span-7 flex flex-col justify-between rounded-3xl border border-gray-100 bg-white p-4 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_50px_-10px_rgba(249,115,22,0.12)] transition-all duration-300 group hover:-translate-y-1">
                <div className="overflow-hidden rounded-2xl relative">
                  <img
                    src="/prod_interview_landscape1.jpeg"
                    alt="Teammate interviewing truck driver"
                    className="w-full object-cover aspect-[16/10] group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur text-white text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold font-mono">
                    📸 Field Log #14
                  </div>
                </div>
                <div className="mt-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                      <span>📍 JAIPUR-DELHI TRANSIT HUB (NH-48)</span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mt-1 leading-snug">
                      Deep-diving into driver operational struggles
                    </h4>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                      Our product team speaking with drivers directly to map out route optimization problems and understand how broker delays impact their working capital.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2">
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">
                      User Centered Design
                    </span>
                  </div>
                </div>
              </div>

              {/* Portrait Image - Close up with Driver */}
              <div className="md:col-span-5 flex flex-col justify-between rounded-3xl border border-gray-100 bg-white p-4 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_50px_-10px_rgba(249,115,22,0.12)] transition-all duration-300 group hover:-translate-y-1 md:translate-y-6">
                <div className="overflow-hidden rounded-2xl relative">
                  <img
                    src="/prod_interview_portrait.jpeg"
                    alt="Truck driver interview close-up"
                    className="w-full object-cover aspect-[3/4] group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur text-white text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold font-mono">
                    🎙️ Direct Feedback
                  </div>
                </div>
                <div className="mt-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                      <span>💬 DRIVER SATNAM SINGH</span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mt-1 leading-snug">
                      "Instant pay keeps us moving without stress."
                    </h4>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed italic">
                      "Traditional brokers hold our freight balance for weeks. With TruckIt's instant wallet transfer, we get paid immediately on delivery, allowing us to buy diesel and send money to our families on time."
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2">
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
                      98% Driver Satisfaction
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────── */}
        <section id="features" className="py-28 px-4 gsap-section">
          <div className="mx-auto max-w-5xl">
            <FadeUp className="text-center mb-14">
              <Pill>Why TruckIt</Pill>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 font-serif">
                Built for reliability.
              </h2>
              <p className="mt-3 text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
                Every feature is designed to take the pain out of freight logistics — for businesses and individuals alike.
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: "⚡", title: "Instant Booking", desc: "Book a truck in under 60 seconds. No calls, no wait — just pick your route, choose your vehicle, and go.", delay: 0 },
                { icon: "📍", title: "Live GPS Tracking", desc: "Track your shipment in real time on an interactive map. Know exactly where your goods are at every moment.", delay: 0.08 },
                { icon: "💰", title: "Transparent Pricing", desc: "Per-kilometre rates with zero hidden charges. See your total cost before you confirm — always.", delay: 0.16 },
                { icon: "🛡️", title: "Insured Cargo", desc: "Every shipment comes with up to ₹10L in cargo insurance. Your goods are protected from pickup to delivery.", delay: 0.24 },
                { icon: "🧑‍✈️", title: "Verified Drivers", desc: "All drivers go through background checks, document verification, and safety training before joining.", delay: 0.32 },
                { icon: "🌐", title: "Pan-India Network", desc: "From metro cities to Tier-3 towns — our fleet covers 28 states with intercity and local routes.", delay: 0.4 },
              ].map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────── */}
        <section id="how-it-works" className="py-28 px-4 bg-gray-50/50 gsap-section">
          <div className="mx-auto max-w-5xl grid md:grid-cols-2 gap-16 items-center">
            <div>
              <FadeUp>
                <Pill>Simple Process</Pill>
                <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 leading-tight font-serif">
                  Book in four
                  <br />
                  easy steps.
                </h2>
                <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                  No complicated forms. No back-and-forth calls. TruckIt gets your cargo moving faster than any other platform.
                </p>
              </FadeUp>
            </div>
            <div className="flex flex-col gap-8">
              {[
                { number: "01", title: "Enter your route", desc: "Type your pickup and drop locations. We geocode and calculate the optimal driving path instantly.", delay: 0 },
                { number: "02", title: "Pick your truck", desc: "Choose from Mini (1T), Medium (3T), or Heavy (10T) based on your cargo volume and urgency.", delay: 0.1 },
                { number: "03", title: "Confirm & pay", desc: "Review the per-km fare, confirm your booking, and pay securely online or on delivery.", delay: 0.2 },
                { number: "04", title: "Track in real time", desc: "Get driver details, live GPS location, and delivery updates until your goods arrive safely.", delay: 0.3 },
              ].map((s) => (
                <Step key={s.number} {...s} />
              ))}
            </div>
          </div>
        </section>

        {/* ── FLEET ────────────────────────────── */}
        <section id="fleet" className="py-28 px-4 gsap-section">
          <div className="mx-auto max-w-5xl">
            <FadeUp className="text-center mb-14">
              <Pill>Our Fleet</Pill>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 font-serif">
                The right truck for every load.
              </h2>
              <p className="mt-3 text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
                Whether you're moving a sofa or a full factory shipment, we have a vehicle tuned to the job.
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <TruckTypeCard emoji="🛻" name="Mini Truck" capacity="Up to 1 Ton · City & local" rate={12} delay={0} />
              <TruckTypeCard emoji="🚚" name="Medium Truck" capacity="Up to 3 Tons · Intercity" rate={18} best delay={0.1} />
              <TruckTypeCard emoji="🚛" name="Heavy Truck" capacity="Up to 10 Tons · Bulk cargo" rate={28} delay={0.2} />
            </div>

            <FadeUp delay={0.3} className="mt-10 rounded-2xl border border-orange-100 bg-orange-50/60 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-3xl">📋</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">Need a custom fleet contract?</p>
                <p className="text-sm text-gray-500 mt-0.5">For businesses shipping daily, we offer dedicated vehicles, invoicing, and priority dispatch.</p>
              </div>
              <a
                href="/startbooking"
                className="flex-shrink-0 rounded-xl border border-orange-300 bg-white px-5 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-500 hover:text-white transition-colors duration-200"
              >
                Talk to Sales →
              </a>
            </FadeUp>
          </div>
        </section>

        {/* ── TESTIMONIALS ─────────────────────── */}
        <section id="testimonials" className="py-28 px-4 bg-gray-50/50 gsap-section">
          <div className="mx-auto max-w-5xl">
            <FadeUp className="text-center mb-14">
              <Pill>User Research Survey</Pill>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 font-serif">
                Loved by our early community
              </h2>
              <p className="mt-3 text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
                We surveyed manufacturers, wholesalers, e-commerce sellers, and transporters across India to validate and solve their biggest freight logistics pain points.
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  name: "Nainy verma",
                  role: "E-commerce Seller",
                  avatar: "NV",
                  quote: "Showing future price trends before booking (like 'Book now for ₹4,200 or wait 3 hours → ₹3,500 likely') is exactly what we need. Driver KYC, live tracking, and fast booking are essential to trust a platform.",
                  rating: 5,
                  delay: 0
                },
                {
                  name: "Shravan Gadavi",
                  role: "Wholesaler & Distributor",
                  avatar: "SG",
                  quote: "Dealing with weekly shipments, high transport costs and empty return trips are our biggest concerns. Full driver KYC, cargo insurance, and live tracking make the marketplace highly reliable.",
                  rating: 5,
                  delay: 0.08
                },
                {
                  name: "Kalash Kaushal",
                  role: "Manufacturer (Daily Logistics)",
                  avatar: "KK",
                  quote: "Wasted empty return trips, delay issues, and lack of real-time tracking are major day-to-day hassles. A simple and fast booking flow with secure payments and transparent pricing solves everything.",
                  rating: 5,
                  delay: 0.16
                },
                {
                  name: "Prateek Tyagi",
                  role: "Retail Owner",
                  avatar: "PT",
                  quote: "We deal with monthly truck transport and often suffer from trust issues. Having automated driver KYC verification, a ratings system, and one-click repeat bookings gives us massive ease of mind.",
                  rating: 5,
                  delay: 0.24
                },
                {
                  name: "Mohit Srivastava",
                  role: "Exporter (Daily Logistics)",
                  avatar: "MS",
                  quote: "Transportation cost is a huge burden. Using empty returning trucks for LTL shipments is a brilliant idea. Add to that transparent pricing and 24/7 customer support, and this becomes a must-have app.",
                  rating: 5,
                  delay: 0.32
                },
                {
                  name: "Srishti Gupta ",
                  role: "Wholesaler / Distributor",
                  avatar: "SG",
                  quote: "Trucks not being available when needed and poor communication with drivers are common broker headaches. Direct truck booking and direct comparisons with market value will optimize our margins.",
                  rating: 5,
                  delay: 0.4
                },
              ].map((t) => (
                <TestimonialCard key={t.name} {...t} />
              ))}
            </div>
          </div>
        </section>


        {/* ── FAQ ──────────────────────────────── */}
        <section id="faq" className="py-28 px-4 gsap-section">
          <div className="mx-auto max-w-2xl">
            <FadeUp className="text-center mb-14">
              <Pill>FAQ</Pill>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 font-serif">
                Common questions.
              </h2>
            </FadeUp>

            {[
              { q: "How quickly can I book a truck?", a: "Typically under 60 seconds. Just enter your pickup and drop location, choose a truck type, confirm pricing, and you're done. A driver is usually assigned within 10–15 minutes.", delay: 0 },
              { q: "Are there any hidden charges?", a: "None whatsoever. You see the per-kilometre rate before booking. Tolls are included in the quoted price. The only additional charge would be waiting time beyond 30 minutes.", delay: 0.05 },
              { q: "What happens if my goods get damaged?", a: "Every shipment includes up to ₹10 lakh in cargo insurance at no extra cost. File a claim through the app and our team resolves it within 3 working days.", delay: 0.1 },
              { q: "Can I schedule a pickup in advance?", a: "Yes. You can schedule pickups up to 7 days in advance. This is especially useful for businesses that plan logistics weekly.", delay: 0.15 },
              { q: "Do you cover rural or remote areas?", a: "We cover 28 states including Tier-2 and Tier-3 cities. If a particular pin code isn't serviceable yet, we'll notify you at the booking step.", delay: 0.2 },
              { q: "Is there a minimum order value?", a: "No minimum order. Whether you're booking a mini truck for a 5 km run or a heavy truck for 1,000 km, TruckIt works the same way.", delay: 0.25 },
            ].map((f) => (
              <FAQItem key={f.q} {...f} />
            ))}
          </div>
        </section>

        {/* ── CTA BANNER ───────────────────────── */}
        <section className="py-28 px-4 gsap-section">
          <div className="mx-auto max-w-4xl">
            <FadeUp>
              <div className="relative rounded-3xl bg-gray-900 overflow-hidden px-8 py-16 text-center">
                {/* Subtle orange glow */}
                <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-64 w-64 bg-orange-500 opacity-20 blur-3xl rounded-full" />
                <div className="relative z-10">
                  <Pill>Ready to move?</Pill>
                  <h2 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-serif">
                    Your first booking
                    <br />
                    is on us.
                  </h2>
                  <p className="mt-4 text-gray-400 max-w-sm mx-auto text-sm leading-relaxed">
                    Use code <span className="text-orange-400 font-semibold">FIRSTMILE</span> at checkout for ₹500 off your first booking. No strings attached.
                  </p>
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href="/startbooking"
                      className="rounded-2xl bg-orange-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-400 transition-colors duration-200"
                    >
                      Start Booking — Free →
                    </a>
                    <a
                      href="#features"
                      className="rounded-2xl border border-white/10 px-8 py-3.5 text-sm font-medium text-gray-400 hover:text-white hover:border-white/30 transition-colors duration-200"
                    >
                      Learn More
                    </a>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────── */}
        <footer className="border-t border-gray-100 py-12 px-4">
          <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3 hover:opacity-90 transition-opacity">
                <img
                  src="/LOGO.png"
                  alt="TruckIt Logo"
                  className="h-8 w-auto object-contain"
                  style={{ mixBlendMode: "multiply" }}
                />
                <span className="font-extrabold text-gray-900 tracking-tight text-base font-serif">
                  TRUCK<span className="text-orange-500">IT</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                India's smartest freight platform. Real trucks, real drivers, real-time tracking.
              </p>
            </div>
            {[
              { heading: "Product", links: ["Features", "Fleet", "Pricing", "API Docs"] },
              { heading: "Company", links: ["About", "Blog", "Careers", "Press"] },
              { heading: "Support", links: ["Help Center", "Contact Us", "Track Order", "Insurance Claims"] },
            ].map((col) => (
              <div key={col.heading}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">{col.heading}</p>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
            <span>© 2025 TruckIt Technologies Pvt. Ltd. All rights reserved.</span>
            <div className="flex gap-5">
              <a href="#" className="hover:text-gray-700 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Cookies</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
} 
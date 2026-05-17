"use client"
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   Tailwind + shadcn assumed available.
   Google Font loaded via <style> tag injection.
───────────────────────────────────────────── */

// ── Fade-in wrapper used throughout ──────────
function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
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
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <>

      <div className="bg-white text-gray-900 antialiased overflow-x-hidden">
        <Navbar />

        {/* ── HERO ─────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden"
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
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Pill>🚛 India's Smartest Freight Platform</Pill>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.05] text-gray-900 font-serif"
            >
              Move anything,
              <br />
              <span className="text-orange-500 font-cursive italic font-normal text-6xl sm:text-7xl md:text-9xl">anywhere.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="mt-6 max-w-xl text-base sm:text-lg text-gray-500 leading-relaxed"
            >
              Book verified trucks in under 60 seconds. Real-time tracking, transparent pricing, and zero hidden charges — from mini pickups to heavy-haul giants.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 flex flex-col sm:flex-row items-center gap-3"
            >
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
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="mt-5 text-xs text-gray-400"
            >
              ✓ No sign-up fee &nbsp;·&nbsp; ✓ Verified drivers &nbsp;·&nbsp; ✓ 24/7 support
            </motion.p>
          </motion.div>

          {/* Floating truck visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mt-16 w-full max-w-3xl mx-auto"
          >
            <div className="rounded-3xl border border-gray-100 bg-white shadow-2xl shadow-gray-200/60 overflow-hidden">
              {/* Mock booking UI */}
              <div className="border-b border-gray-100 px-5 py-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-300" />
                <div className="h-3 w-3 rounded-full bg-yellow-300" />
                <div className="h-3 w-3 rounded-full bg-green-300" />
                <span className="ml-3 text-xs text-gray-400 font-mono">truckit.app/book</span>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="col-span-2 sm:col-span-3 rounded-2xl bg-gray-50 p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl">📍</div>
                  <div className="flex-1">
                    <div className="h-2.5 w-24 rounded bg-gray-200 mb-2" />
                    <div className="h-2 w-36 rounded bg-gray-100" />
                  </div>
                </div>
                {["🛻 Mini · ₹12/km", "🚚 Medium · ₹18/km", "🚛 Heavy · ₹28/km"].map((t, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-3 text-center text-xs font-medium ${
                      i === 1
                        ? "border-orange-300 bg-orange-50 text-orange-700"
                        : "border-gray-100 bg-white text-gray-500"
                    }`}
                  >
                    {t}
                  </div>
                ))}
                <div className="col-span-2 sm:col-span-3">
                  <div className="w-full rounded-xl bg-orange-500 py-3 text-center text-sm font-semibold text-white shadow shadow-orange-200">
                    Confirm Booking — ₹2,160
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── STATS ────────────────────────────── */}
        <section className="border-y border-gray-100 bg-gray-50/50">
          <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
            <StatCard value="50,000+" label="Deliveries completed" icon="📦" />
            <StatCard value="1,200+" label="Verified truck partners" icon="🚛" />
            <StatCard value="4.9★" label="Average driver rating" icon="⭐" />
            <StatCard value="28" label="States covered" icon="🗺️" />
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────── */}
        <section id="features" className="py-28 px-4">
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
        <section id="how-it-works" className="py-28 px-4 bg-gray-50/50">
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
        <section id="fleet" className="py-28 px-4">
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
        <section id="testimonials" className="py-28 px-4 bg-gray-50/50">
          <div className="mx-auto max-w-5xl">
            <FadeUp className="text-center mb-14">
              <Pill>Testimonials</Pill>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 font-serif">
                Trusted by thousands.
              </h2>
              <p className="mt-3 text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
                From solo movers to large enterprises — here's what our customers say about TruckIt.
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { name: "Rahul Mehta", role: "Furniture Business, Jaipur", avatar: "RM", quote: "We used to spend hours calling transporters. TruckIt cut that to 2 minutes. The live tracking alone is worth it — our clients love knowing exactly where their delivery is.", rating: 5, delay: 0 },
                { name: "Priya Iyer", role: "E-commerce Seller, Chennai", avatar: "PI", quote: "Shipped 12 orders this month using TruckIt's medium trucks. Zero cancellations, zero damage. The pricing is genuinely transparent — what you see is what you pay.", rating: 5, delay: 0.08 },
                { name: "Deepak Sharma", role: "Construction Contractor, Delhi", avatar: "DS", quote: "Needed a heavy truck on short notice for a site in Gurugram. Booked in under a minute, driver arrived on time. Will never go back to the old way.", rating: 5, delay: 0.16 },
                { name: "Ananya Joshi", role: "Home Mover, Bengaluru", avatar: "AJ", quote: "Moving flats is already stressful. TruckIt made the logistics part completely stress-free. The mini truck was clean, the driver was professional, and the price was fair.", rating: 5, delay: 0.24 },
                { name: "Kiran Reddy", role: "Logistics Manager, Hyderabad", avatar: "KR", quote: "We integrated TruckIt into our supply chain ops. The API is clean, delivery windows are reliable, and the support team is genuinely responsive. Highly recommend.", rating: 5, delay: 0.32 },
                { name: "Neeraj Gupta", role: "Retailer, Pune", avatar: "NG", quote: "I was skeptical at first but the ₹18/km for the medium truck is actually cheaper than what we were paying our regular transporter. Switching was the best decision.", rating: 4, delay: 0.4 },
              ].map((t) => (
                <TestimonialCard key={t.name} {...t} />
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST BAND ───────────────────────── */}
        <section className="py-16 px-4 border-y border-gray-100">
          <div className="mx-auto max-w-5xl">
            <FadeUp className="text-center mb-10">
              <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                Trusted by companies across India
              </p>
            </FadeUp>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
              {["Flipkart Partners", "Amazon Flex", "BigBasket", "Meesho Logistics", "Delhivery", "Reliance Retail"].map((b, i) => (
                <FadeUp key={b} delay={i * 0.06}>
                  <span className="text-sm font-semibold text-gray-300 hover:text-gray-500 transition-colors cursor-default">
                    {b}
                  </span>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────── */}
        <section id="faq" className="py-28 px-4">
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
        <section className="py-28 px-4">
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
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-xl bg-orange-500 flex items-center justify-center text-base">🚛</div>
                <span className="font-extrabold text-gray-900 tracking-tight">TRUCK<span className="text-orange-500">IT</span></span>
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
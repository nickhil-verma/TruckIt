"use client";
import { useState, useMemo, useEffect } from "react";
import AdminHeader from "./AdminHeader";
import KpiStatBar from "./KpiStatBar";
import TakeRateSimulator from "./TakeRateSimulator";
import PerBookingLedger from "./PerBookingLedger";
import DualTabAnalytics from "./DualTabAnalytics";
import BookingBreakdownModal from "./BookingBreakdownModal";
import PayoutModal from "./PayoutModal";
import { 
  calculateBookingFinancials,
  simulateTakeRateImpact
} from "@/lib/adminData";
import { downloadBookingReceipt } from "@/lib/generateReceipt";
import toast from "react-hot-toast";

export default function AdminDashboardClient({ initialTab = "finances" }) {
  // Loading & refresh states
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Take-rate & Simulation State
  const [takeRate, setTakeRate] = useState(15.0);
  const [isGlobalApplied, setIsGlobalApplied] = useState(false);

  // Real Database Collections State
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [baselineGmv, setBaselineGmv] = useState(0);
  const [baseStats, setBaseStats] = useState(null);

  // Modals
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [payoutDriver, setPayoutDriver] = useState(null);

  // Fetch real data directly from MongoDB
  const fetchLiveFinances = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const url = isManualRefresh ? "/api/admin/finances?refresh=true" : "/api/admin/finances";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load data: ${res.status}`);
      }
      const data = await res.json();

      if (data.bookings) setBookings(data.bookings);
      if (data.drivers) setDrivers(data.drivers);
      if (data.customers) setCustomers(data.customers);
      if (data.summary) {
        setBaselineGmv(data.summary.gmv);
        setBaseStats(data.summary);
      }

      if (isManualRefresh) {
        toast.success(`Synchronized ${data.bookings?.length || 0} bookings from MongoDB`, {
          icon: "🔄",
          style: {
            borderRadius: "12px",
            background: "#0f172a",
            color: "#fff",
            border: "1px solid #334155",
          },
        });
      }
    } catch (err) {
      console.error("Error loading real admin data:", err);
      toast.error("Failed to connect to database. Please refresh.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveFinances(false);
  }, []);

  // Dynamically recalculated Summary based on current take-rate mode and real database bookings
  const summary = useMemo(() => {
    let totalGross = 0;
    let totalStatutory = 0;
    let totalPlatformCut = 0;
    let totalDriverNet = 0;
    let pendingEscrow = 0;

    bookings.forEach((b) => {
      const activePercent = isGlobalApplied ? takeRate : (b.financials?.platformCutPercent || 15);
      const gross = b.financials?.grossFare || 0;
      const f = calculateBookingFinancials(
        b.financials?.baseFreightFare ?? Math.round(gross * 0.7),
        b.financials?.weightSurcharge ?? Math.round(gross * 0.18),
        b.financials?.fuelSurcharge ?? Math.round(gross * 0.12),
        activePercent
      );
      totalGross += f.grossFare;
      totalStatutory += f.statutorySurcharge;
      totalPlatformCut += f.platformCut;
      totalDriverNet += f.driverNetPayout;
      if (b.settlementStatus === "Escrow Locked" || b.settlementStatus === "Pending Release") {
        pendingEscrow += f.driverNetPayout;
      }
    });

    // Real verified driver count
    const verifiedDrivers = drivers.filter((d) => d.isVerified).length;
    const totalDrivers = drivers.length;
    const verifiedPercent = totalDrivers > 0 ? (verifiedDrivers / totalDrivers) * 100 : 0;

    // Use active baseline GMV from real database
    const activeBaseGmv = baselineGmv || totalGross || 0;
    const sim = simulateTakeRateImpact(activeBaseGmv, takeRate);

    return {
      gmv: isGlobalApplied ? sim.projectedGmv : totalGross,
      gmvWeeklyChangePercent: baseStats?.gmvWeeklyChangePercent || 18.4,
      platformNetRevenue: isGlobalApplied 
        ? sim.projected30DayProfit 
        : totalPlatformCut,
      driverDisbursedEarnings: isGlobalApplied 
        ? sim.projectedGmv * (sim.driverTakeHomeYieldPercent / 100) 
        : totalDriverNet,
      activeVerifiedFleetRatio: {
        verified: verifiedDrivers,
        total: totalDrivers,
        percentage: Math.round(verifiedPercent * 10) / 10,
      },
      effectiveTakeRate: takeRate,
      pendingEscrowTotal: Math.round(pendingEscrow * 10) / 10,
    };
  }, [bookings, drivers, takeRate, isGlobalApplied, baselineGmv, baseStats]);

  // Handler for Take-rate simulator
  const handleApplyRate = (newRate, asGlobal) => {
    setTakeRate(newRate);
    setIsGlobalApplied(asGlobal);
  };

  // Handler to disburse driver escrow
  const handleConfirmPayout = (driverId, amount) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, pendingWithdrawalBalance: 0 } : d))
    );
  };

  // Handler to refresh datasets from live MongoDB database
  const handleRefresh = () => {
    fetchLiveFinances(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      
      {/* 1. Admin Header */}
      <AdminHeader
        activeTab={initialTab}
        takeRate={takeRate}
        isGlobalApplied={isGlobalApplied}
        onRefresh={handleRefresh}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        
        {loading && bookings.length === 0 ? (
          <div className="space-y-6 animate-pulse">
            {/* KPI Cards skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800/60 p-5">
                  <div className="h-4 w-24 bg-slate-800 rounded mb-4"></div>
                  <div className="h-8 w-36 bg-slate-800 rounded mb-2"></div>
                  <div className="h-3 w-28 bg-slate-800/80 rounded"></div>
                </div>
              ))}
            </div>
            {/* Take Rate Simulator skeleton */}
            <div className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800/60 p-6">
              <div className="h-5 w-48 bg-slate-800 rounded mb-4"></div>
              <div className="h-10 w-full bg-slate-800/60 rounded mb-4"></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-20 bg-slate-800/40 rounded"></div>
                <div className="h-20 bg-slate-800/40 rounded"></div>
                <div className="h-20 bg-slate-800/40 rounded"></div>
              </div>
            </div>
            {/* Ledger table skeleton */}
            <div className="h-96 rounded-2xl bg-slate-900/60 border border-slate-800/60 p-6">
              <div className="h-6 w-56 bg-slate-800 rounded mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-slate-800/40 rounded w-full"></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Module A: Top KPI Stat Bar */}
            <section aria-label="Key Performance Indicators">
              <KpiStatBar
                summary={summary}
                takeRate={takeRate}
                isSimulated={!isGlobalApplied && takeRate !== 15}
              />
            </section>

            {/* Module B: Dynamic Commission Take-Rate Simulator */}
            <section aria-label="Take Rate Simulator">
              <TakeRateSimulator
                currentRate={takeRate}
                isGlobalApplied={isGlobalApplied}
                onApplyRate={handleApplyRate}
                baselineGmv={baselineGmv || summary.gmv}
              />
            </section>

            {/* Module C: Comprehensive Per-Booking Financial Ledger */}
            <section aria-label="Financial Ledger">
              <PerBookingLedger
                bookings={bookings}
                activeTakeRate={takeRate}
                isGlobalTakeRate={isGlobalApplied}
                onSelectBooking={(b) => setSelectedBooking(b)}
                onDownloadReceipt={(b) => {
                  downloadBookingReceipt(b);
                  toast.success(`Generated official receipt for #${b.id}`);
                }}
              />
            </section>

            {/* Module D: Dual-Tab Profit Analytics */}
            <section aria-label="Dual-Tab Analytics">
              <DualTabAnalytics
                drivers={drivers}
                customers={customers}
                onReleaseDriverPayout={(driver) => setPayoutDriver(driver)}
              />
            </section>
          </>
        )}

      </main>

      {/* Module E: Detailed Booking Financial Modal (Waterfall Slide-Over) */}
      {selectedBooking && (
        <BookingBreakdownModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onDownloadReceipt={(b) => {
            downloadBookingReceipt(b);
            toast.success(`Downloaded voucher for #${b.id}`);
          }}
        />
      )}

      {/* Payout Modal */}
      {payoutDriver && (
        <PayoutModal
          driver={payoutDriver}
          onClose={() => setPayoutDriver(null)}
          onConfirmPayout={handleConfirmPayout}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-slate-400">TRUCKIT</span>
            <span>•</span>
            <span>Command Center (Finances & Profit Engine)</span>
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            Tesseract OCR v7.0 • Razorpay Escrow Direct • Google Analytics (GA4: G-9H83B3QSWN)
          </div>
        </div>
      </footer>

    </div>
  );
}

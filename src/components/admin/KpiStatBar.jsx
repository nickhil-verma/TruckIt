"use client";
import { 
  TrendingUp, 
  DollarSign, 
  Truck, 
  Users, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowUpRight, 
  Lock, 
  Percent,
  Sparkles
} from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/adminData";

export default function KpiStatBar({ summary, takeRate = 15, isSimulated = false }) {
  const {
    gmv = 0,
    gmvWeeklyChangePercent = 18.4,
    platformNetRevenue = 0,
    driverDisbursedEarnings = 0,
    activeVerifiedFleetRatio = { verified: 28, total: 32, percentage: 87.5 },
    pendingEscrowTotal = 0,
  } = summary || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
      
      {/* 1. Gross Merchandise Value (GMV) */}
      <div className="relative group overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800/80 p-5 backdrop-blur-md hover:border-slate-700/80 transition-all duration-300">
        <div className="absolute top-0 right-0 w-28 h-28 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Gross Merchandise Value (GMV)
          </span>
          <div className="h-9 w-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-sm">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {formatCurrency(gmv)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{gmvWeeklyChangePercent}% vs last week</span>
          </div>
          <span className="text-slate-400">Total Booked Volume</span>
        </div>
      </div>

      {/* 2. TRUCKIT Net Commission / Profit */}
      <div className="relative group overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800/80 p-5 backdrop-blur-md hover:border-emerald-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              TRUCKIT Net Profit
            </span>
            {isSimulated && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Simulated
              </span>
            )}
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
            {formatCurrency(platformNetRevenue)}
          </span>
          <span className="text-xs font-semibold text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            {takeRate}% Margin
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
          <span className="text-slate-300 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Net Platform Take
          </span>
          <span className="text-slate-400">Post-RTO & Insurance</span>
        </div>
      </div>

      {/* 3. Disbursed Driver Earnings */}
      <div className="relative group overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800/80 p-5 backdrop-blur-md hover:border-cyan-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Disbursed Driver Earnings
          </span>
          <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-sm">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {formatCurrency(driverDisbursedEarnings)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1 text-cyan-400 font-medium">
            <span>{formatPercent((driverDisbursedEarnings / (gmv || 1)) * 100, 1)} Payout Ratio</span>
          </div>
          <span className="text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            {formatCurrency(pendingEscrowTotal)} Escrow
          </span>
        </div>
      </div>

      {/* 4. Active Verified Fleet Ratio */}
      <div className="relative group overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800/80 p-5 backdrop-blur-md hover:border-blue-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Active Verified Fleet
          </span>
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {activeVerifiedFleetRatio.percentage}%
          </span>
          <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-blue-400" />
            OCR Audit
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
          <span className="text-slate-300 font-medium">
            {activeVerifiedFleetRatio.verified} / {activeVerifiedFleetRatio.total} Drivers Verified
          </span>
          <span className="text-slate-400">
            {activeVerifiedFleetRatio.total - activeVerifiedFleetRatio.verified} Pending KYC
          </span>
        </div>
      </div>

    </div>
  );
}

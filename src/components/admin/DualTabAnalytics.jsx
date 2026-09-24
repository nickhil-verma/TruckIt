"use client";
import { useState } from "react";
import { 
  Truck, 
  Building2, 
  CheckCircle2, 
  ArrowUpRight, 
  IndianRupee, 
  CreditCard, 
  TrendingUp, 
  ShieldCheck, 
  Percent,
  Star,
  Layers,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/adminData";

export default function DualTabAnalytics({
  drivers = [],
  customers = [],
  onReleaseDriverPayout,
}) {
  const [activeTab, setActiveTab] = useState("drivers"); // "drivers" or "customers"

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md overflow-hidden shadow-xl">
      
      {/* Tab Switcher Header */}
      <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Profit & Settlement Analytics</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Audit Telemetry
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor partner margins, driver payout escrow releases, and enterprise volume brackets.
          </p>
        </div>

        {/* Dual Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("drivers")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "drivers"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Driver Settlements & Margins</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("customers")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "customers"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Customer & Enterprise Margins</span>
          </button>
        </div>
      </div>

      {/* Tab Content: 1. Driver Settlements & Margins */}
      {activeTab === "drivers" && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Verified Fleet Operator</th>
                <th className="py-3.5 px-4">Fleet / Status</th>
                <th className="py-3.5 px-4 text-center">Trips Completed</th>
                <th className="py-3.5 px-4 text-right">Lifetime Gross (₹)</th>
                <th className="py-3.5 px-4 text-right">Platform Cut (₹)</th>
                <th className="py-3.5 px-4 text-right">Pending Withdrawal (₹)</th>
                <th className="py-3.5 px-4 text-right">Disbursement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {drivers.map((drv) => (
                <tr key={drv.id} className="hover:bg-slate-800/30 transition-colors">
                  
                  {/* Operator Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-orange-400 text-xs">
                        {drv.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">{drv.name}</span>
                          {drv.isVerified && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              ✓ Verified Driver
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                          <span>{drv.truckPlate}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-amber-400 font-sans">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {drv.rating.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Fleet Type & Status */}
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-300 block">{drv.fleetType}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium mt-0.5 ${
                      drv.status === "Active on Highway"
                        ? "text-emerald-400"
                        : drv.status === "Available at Hub"
                        ? "text-cyan-400"
                        : "text-slate-400"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        drv.status === "Active on Highway"
                          ? "bg-emerald-400 animate-pulse"
                          : drv.status === "Available at Hub"
                          ? "bg-cyan-400"
                          : "bg-slate-500"
                      }`} />
                      {drv.status}
                    </span>
                  </td>

                  {/* Trips */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-bold text-white font-mono text-sm">
                      {drv.tripsCompleted}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Corridors</span>
                  </td>

                  {/* Lifetime Gross */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-bold text-white font-mono text-sm block">
                      {formatCurrency(drv.lifetimeGrossGenerated)}
                    </span>
                    <span className="text-[10px] text-slate-400">Total Bookings</span>
                  </td>

                  {/* Platform Cut Contributed */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-bold text-emerald-400 font-mono text-sm block">
                      {formatCurrency(drv.totalPlatformCutContributed)}
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-medium">
                      Net TRUCKIT Take
                    </span>
                  </td>

                  {/* Pending Withdrawal */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-bold text-cyan-300 font-mono text-sm block">
                      {formatCurrency(drv.pendingWithdrawalBalance)}
                    </span>
                    <span className="text-[10px] text-slate-400">Escrow Ready</span>
                  </td>

                  {/* Payout Action */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onReleaseDriverPayout?.(drv)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Release Payout</span>
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content: 2. Customer & Enterprise Margins */}
      {activeTab === "customers" && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Enterprise Account</th>
                <th className="py-3.5 px-4">Tier & Contracts</th>
                <th className="py-3.5 px-4 text-center">Volume Booked</th>
                <th className="py-3.5 px-4 text-right">Total Freight Spend (₹)</th>
                <th className="py-3.5 px-4 text-right">Avg. Commission Margin</th>
                <th className="py-3.5 px-4">Volume Discount Bracket</th>
                <th className="py-3.5 px-4">Preferred Fleet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {customers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-800/30 transition-colors">
                  
                  {/* Account Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
                        <Building2 className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <span className="font-semibold text-white block">{cust.enterpriseName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{cust.id}</span>
                      </div>
                    </div>
                  </td>

                  {/* Tier & Contracts */}
                  <td className="py-3.5 px-4">
                    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      cust.tier === "Enterprise Tier 1"
                        ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                        : cust.tier === "Strategic Partner"
                        ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}>
                      {cust.tier}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {cust.activeContracts} Active SLA Contracts
                    </span>
                  </td>

                  {/* Volume Booked */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-bold text-white font-mono text-sm">
                      {cust.totalVolumeBooked}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Loads Dispatched</span>
                  </td>

                  {/* Total Spend */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-bold text-white font-mono text-sm block">
                      {formatCurrency(cust.totalFreightSpend)}
                    </span>
                    <span className="text-[10px] text-slate-400">Total Billed</span>
                  </td>

                  {/* Avg Commission Margin */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-bold text-emerald-400 font-mono text-sm block">
                      {formatPercent(cust.avgCommissionMarginAchieved, 1)}
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-medium">
                      Platform Yield
                    </span>
                  </td>

                  {/* Discount Bracket */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-950 text-slate-200 border border-slate-800">
                      <Percent className="w-3 h-3 text-orange-400" />
                      <span>{cust.discountBracket}</span>
                    </span>
                  </td>

                  {/* Preferred Fleet */}
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-300">{cust.preferredFleet}</span>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer info */}
      <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
        <span>Razorpay Connected Direct Banking enabled for Instant Escrow Payouts</span>
        <span className="text-slate-300">Audited every 24 hours under PCI-DSS logistics escrow compliance</span>
      </div>

    </div>
  );
}

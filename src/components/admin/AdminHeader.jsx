"use client";
import Link from "next/link";
import { 
  ShieldCheck, 
  TrendingUp, 
  Sliders, 
  ArrowLeft, 
  Layers, 
  Bell, 
  Sparkles,
  RefreshCw,
  FileSpreadsheet
} from "lucide-react";

export default function AdminHeader({ 
  activeTab = "finances", 
  onRefresh, 
  onExportCsv,
  takeRate = 15,
  isGlobalApplied = false 
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: Brand & Admin Badge */}
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 group transition-opacity"
              title="Return to TRUCKIT Public Site"
            >
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 group-hover:scale-105 transition-transform">
                <span className="font-extrabold text-xl tracking-tighter font-serif">T</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white tracking-tight text-lg font-serif">
                    TRUCK<span className="text-orange-500">IT</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30">
                    <ShieldCheck className="w-3 h-3 text-orange-400" />
                    COMMAND CENTER
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Revenue, Commission & Profit Engine</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[11px] text-emerald-400 font-medium">Live Audit Active</span>
                </p>
              </div>
            </Link>
          </div>

          {/* Center: System Status & Global Rate Indicator */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center gap-2.5 shadow-inner">
              <span className="text-slate-400">Platform Take-Rate:</span>
              <span className="font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                {takeRate}%
              </span>
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                isGlobalApplied 
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                  : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              }`}>
                {isGlobalApplied ? "Global Fleet Active" : "Simulated Mode"}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>Tesseract OCR v7.0 Online</span>
            </div>
          </div>

          {/* Right: Actions & Return Navigation */}
          <div className="flex items-center gap-3">
            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Refresh Financial Ledger"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {onExportCsv && (
              <button
                onClick={onExportCsv}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 hover:text-white transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Ledger</span>
              </button>
            )}

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>User App</span>
            </Link>

            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20 text-xs">
              AD
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}

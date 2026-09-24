"use client";
import { useState, useId } from "react";
import { 
  Sliders, 
  TrendingUp, 
  Truck, 
  Users, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Percent
} from "lucide-react";
import { formatCurrency, formatPercent, simulateTakeRateImpact } from "@/lib/adminData";
import toast from "react-hot-toast";

export default function TakeRateSimulator({
  currentRate = 15,
  onApplyRate,
  isGlobalApplied = false,
  baselineGmv = 4232100.0,
}) {
  const [sliderValue, setSliderValue] = useState(currentRate);
  const [isGlobalMode, setIsGlobalMode] = useState(isGlobalApplied);
  const sliderId = useId();

  // Run dynamic mathematical simulation
  const simulation = simulateTakeRateImpact(baselineGmv, sliderValue);
  const baselineSim = simulateTakeRateImpact(baselineGmv, 15);

  const profitDiff = simulation.projected30DayProfit - baselineSim.projected30DayProfit;
  const isDiffFromBaseline = sliderValue !== 15;

  const presets = [
    { label: "Competitive", rate: 10, hint: "High driver retention" },
    { label: "Standard Target", rate: 15, hint: "Balanced marketplace" },
    { label: "Enterprise Scale", rate: 18, hint: "Optimized corporate margin" },
    { label: "Peak Surge", rate: 22, hint: "Festival corridor surge" },
    { label: "Max Margin", rate: 25, hint: "Hard platform ceiling" },
  ];

  const handleApply = (asGlobal = isGlobalMode) => {
    onApplyRate?.(sliderValue, asGlobal);
    if (asGlobal) {
      toast.success(`Platform Take-Rate committed to Global Fleet at ${sliderValue}%!`, {
        icon: "⚡",
        style: {
          borderRadius: "12px",
          background: "#0f172a",
          color: "#fff",
          border: "1px solid #334155",
        },
      });
    } else {
      toast(`Simulated Take-Rate set to ${sliderValue}% for auditing`, {
        icon: "🔬",
        style: {
          borderRadius: "12px",
          background: "#0f172a",
          color: "#fff",
          border: "1px solid #334155",
        },
      });
    }
  };

  const handleReset = () => {
    setSliderValue(15);
    setIsGlobalMode(false);
    onApplyRate?.(15, false);
    toast.success("Take-Rate reset to default baseline (15.0%)");
  };

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-5 sm:p-6 backdrop-blur-md relative overflow-hidden shadow-xl">
      {/* Decorative gradient glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Dynamic Commission Take-Rate Simulator
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Formula Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate 30-day profit projections, driver take-home yield, and customer booking elasticity across the fleet.
            </p>
          </div>
        </div>

        {/* Global vs Test Scenario Toggle */}
        <div className="flex items-center gap-3 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsGlobalMode(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !isGlobalMode
                ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Test Scenario Only
          </button>
          <button
            type="button"
            onClick={() => setIsGlobalMode(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isGlobalMode
                ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Apply to Global Fleet
          </button>
        </div>
      </div>

      {/* Main Interactive Controls & Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        
        {/* Left Column: Slider & Presets (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          
          {/* Slider Display & Controls */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor={sliderId} className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span>Commission Take-Rate</span>
                <span className="text-xs font-normal text-slate-400">(Adjustable 8% - 25%)</span>
              </label>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-orange-400 font-mono">
                  {sliderValue.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400 font-sans">
                  {isDiffFromBaseline ? `(${profitDiff >= 0 ? "+" : ""}${((sliderValue - 15)).toFixed(1)}% vs baseline)` : "(Standard)"}
                </span>
              </div>
            </div>

            {/* Range Slider */}
            <div className="relative py-2">
              <input
                id={sliderId}
                type="range"
                min="8"
                max="25"
                step="0.5"
                value={sliderValue}
                onChange={(e) => setSliderValue(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2 px-0.5">
                <span>8.0% (Min)</span>
                <span className="text-slate-300 font-semibold">15.0% (Target Baseline)</span>
                <span>25.0% (Max Cap)</span>
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-2">
              Standard Rate Scenarios:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {presets.map((p) => {
                const isActive = sliderValue === p.rate;
                return (
                  <button
                    key={p.rate}
                    type="button"
                    onClick={() => setSliderValue(p.rate)}
                    className={`px-2.5 py-2 rounded-xl text-left border transition-all ${
                      isActive
                        ? "bg-orange-500/15 border-orange-500/50 text-orange-300 shadow-sm"
                        : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{p.rate}%</span>
                      {isActive && <Check className="w-3 h-3 text-orange-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{p.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Button Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleApply(isGlobalMode)}
              className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isGlobalMode ? "Apply New Rate to Global Fleet" : "Audit Simulated Scenario"}
              </span>
            </button>

            {isDiffFromBaseline && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition-colors"
                title="Reset to 15.0% Baseline"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset Baseline</span>
              </button>
            )}
          </div>

        </div>

        {/* Right Column: Projected Real-time Simulation Output (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3">
          
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/70 pb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Simulated Impact Waterfall
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                30-Day Outlook
              </span>
            </div>

            {/* Metric 1: Projected 30-Day Platform Gross Profit */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-300 font-medium block">
                  Projected 30-Day Net Profit
                </span>
                <span className="text-[11px] text-slate-400">
                  Platform Commission (post-RTO)
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-emerald-400 font-mono block">
                  {formatCurrency(simulation.projected30DayProfit)}
                </span>
                <span className={`text-[11px] font-semibold ${profitDiff >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                  {profitDiff >= 0 ? "+" : ""}{formatCurrency(profitDiff)} vs baseline
                </span>
              </div>
            </div>

            {/* Metric 2: Driver Take-Home Yield */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
              <div>
                <span className="text-xs text-slate-300 font-medium block">
                  Driver Take-Home Yield
                </span>
                <span className="text-[11px] text-slate-400">
                  Gross Fare share disbursed
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-white font-mono block">
                  {formatPercent(simulation.driverTakeHomeYieldPercent, 2)}
                </span>
                <span className="text-[11px] text-slate-400">
                  {simulation.driverTakeHomeYieldPercent > 80 ? "Healthy Driver Retention" : "Tight Margin Zone"}
                </span>
              </div>
            </div>

            {/* Metric 3: Customer Booking Volume Elasticity */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
              <div>
                <span className="text-xs text-slate-300 font-medium block">
                  Booking Volume Elasticity
                </span>
                <span className="text-[11px] text-slate-400">
                  Projected demand curve response
                </span>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold font-mono block ${
                  simulation.projectedVolumeElasticityPercent >= 0 ? "text-cyan-400" : "text-amber-400"
                }`}>
                  {simulation.projectedVolumeElasticityPercent > 0 ? "+" : ""}
                  {formatPercent(simulation.projectedVolumeElasticityPercent, 1)}
                </span>
                <span className="text-[11px] text-slate-400">
                  {simulation.projectedVolumeElasticityPercent >= 0 ? "Expansionary" : "Contractive Elasticity"}
                </span>
              </div>
            </div>

          </div>

          {/* Micro Status Alert */}
          <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <span>
              {isGlobalMode ? (
                <strong className="text-orange-300">Global Fleet Mode Active:</strong>
              ) : (
                <strong className="text-slate-200">Sandbox Simulation:</strong>
              )}{" "}
              Adjusting take-rate recalculates per-trip platform cuts on commissionable base (after 3% statutory RTO surcharge).
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}

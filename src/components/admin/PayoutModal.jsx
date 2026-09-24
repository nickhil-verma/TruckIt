"use client";
import { useState } from "react";
import { X, CreditCard, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/adminData";
import toast from "react-hot-toast";

export default function PayoutModal({ driver, onClose, onConfirmPayout }) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!driver) return null;

  const handleDisburse = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onConfirmPayout?.(driver.id, driver.pendingWithdrawalBalance);
      toast.success(
        `Disbursed ${formatCurrency(driver.pendingWithdrawalBalance)} to ${driver.name} via Razorpay Auto-Payouts!`,
        {
          icon: "🚀",
          style: {
            borderRadius: "12px",
            background: "#0f172a",
            color: "#fff",
            border: "1px solid #334155",
          },
        }
      );
      onClose?.();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Disburse Driver Escrow Payout
              </h3>
              <p className="text-xs text-slate-400">Razorpay Connected Banking</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-5 space-y-4 text-xs text-slate-300">
          {/* Driver details card */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-sm">{driver.name}</span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                ✓ Verified Driver
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Plate: {driver.truckPlate}</span>
              <span>Trips Done: {driver.tripsCompleted}</span>
            </div>
          </div>

          {/* Amount to disburse */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-[11px] uppercase tracking-wider text-emerald-400/90 font-semibold block mb-1">
              Net Disbursal Amount
            </span>
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">
              {formatCurrency(driver.pendingWithdrawalBalance)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Zero platform deduction (Platform take already captured upon booking)
            </span>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Direct IMPS/NEFT routing to driver's bank verified via Tesseract OCR verified driving license records.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDisburse}
            disabled={isProcessing || driver.pendingWithdrawalBalance <= 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all"
          >
            {isProcessing ? (
              <span>Processing Escrow Transfer...</span>
            ) : (
              <>
                <span>Confirm & Release</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

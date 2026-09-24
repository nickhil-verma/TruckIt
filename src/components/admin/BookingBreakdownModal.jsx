"use client";
import { useEffect } from "react";
import { 
  X, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  CheckCircle2, 
  Download, 
  DollarSign, 
  Percent, 
  Receipt, 
  FileText, 
  Calendar, 
  User, 
  Building2, 
  CreditCard,
  Lock,
  ArrowRight,
  ExternalLink,
  Printer
} from "lucide-react";
import { formatCurrency, formatPercent, validateTruckPlate } from "@/lib/adminData";
import toast from "react-hot-toast";

export default function BookingBreakdownModal({ 
  booking, 
  onClose,
  onDownloadReceipt 
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!booking) return null;

  const {
    id,
    timestamp,
    customer,
    driver,
    route,
    fleetType,
    cargoDescription,
    tonnage,
    financials,
    settlementStatus,
    escrowReleaseDate,
    paymentMethod,
    razorpayPaymentId,
  } = booking;

  const isPlateValid = validateTruckPlate(driver.truckPlate);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Booking #{id} Audit & Financial Waterfall
                </h3>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  settlementStatus === "Paid"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : settlementStatus === "Escrow Locked"
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                    : "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                }`}>
                  {settlementStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Logged at {new Date(timestamp).toUTCString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDownloadReceipt?.(booking)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Download Ledger Breakdown"
            >
              <Download className="w-4 h-4 text-orange-400" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          
          {/* Section 1: Route Corridor & OpenStreetMap Telemetry */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                Route Stops & Telemetry (OpenStreetMap Engine)
              </span>
              <span className="font-mono text-cyan-400 text-xs font-bold">
                {route.distanceKm} km total
              </span>
            </div>

            {/* Corridor visualization */}
            <div className="space-y-2 pt-1">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
                  <div className="w-0.5 h-6 bg-slate-700 my-0.5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Pickup Origin</span>
                  <p className="text-sm font-semibold text-white">{route.origin}</p>
                </div>
              </div>

              {route.viaStops && route.viaStops.length > 0 && (
                <div className="pl-6 space-y-1.5 py-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Via Waypoints & Toll Corridors:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {route.viaStops.map((stop, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        {stop}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="mt-1 flex flex-col items-center">
                  <div className="w-0.5 h-2 bg-slate-700 mb-0.5" />
                  <div className="w-3 h-3 rounded-full bg-orange-400 ring-4 ring-orange-500/20" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-orange-400">Final Destination</span>
                  <p className="text-sm font-semibold text-white">{route.destination}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
              <span>Fleet Category: <strong className="text-slate-200">{fleetType}</strong> ({tonnage} Tons Payload)</span>
              <span>Cargo: <strong className="text-slate-200">{cargoDescription}</strong></span>
            </div>
          </div>

          {/* Section 2: Itemized Financial Waterfall */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Itemized Financial Waterfall Breakdown
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                Formula: Gross - 3% RTO - Platform Take = Driver Net
              </span>
            </div>

            <div className="space-y-2 font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/40 text-slate-300">
                <span className="font-sans">Base Mileage Freight Fare:</span>
                <span className="font-bold">{formatCurrency(financials.baseFreightFare)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/40 text-slate-300">
                <span className="font-sans">Fleet Weight Surcharge ({tonnage}T tier):</span>
                <span className="font-bold">{formatCurrency(financials.weightSurcharge)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/40 text-slate-300">
                <span className="font-sans">Fuel Index Surcharge:</span>
                <span className="font-bold">{formatCurrency(financials.fuelSurcharge)}</span>
              </div>

              <div className="flex justify-between py-1.5 bg-slate-900/90 px-3 rounded-lg text-white font-bold text-sm">
                <span className="font-sans">1. Gross Booking Fare ($):</span>
                <span className="text-white">{formatCurrency(financials.grossFare)}</span>
              </div>

              <div className="flex justify-between py-1 text-slate-400">
                <span className="font-sans">2. Less Statutory Insurance / RTO Surcharge (3.0%):</span>
                <span className="text-red-400">-{formatCurrency(financials.statutorySurcharge)}</span>
              </div>

              <div className="flex justify-between py-1 bg-slate-900/60 px-3 rounded-lg text-slate-300">
                <span className="font-sans">3. Net Commissionable Base ($):</span>
                <span className="font-semibold text-slate-200">{formatCurrency(financials.netCommissionableBase)}</span>
              </div>

              <div className="flex justify-between py-1.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                <span className="font-sans flex items-center gap-1.5">
                  <span>4. TRUCKIT Platform Cut / Commission:</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20">
                    {financials.platformCutPercent}%
                  </span>
                </span>
                <span>{formatCurrency(financials.platformCut)}</span>
              </div>

              <div className="flex justify-between py-2 px-3 rounded-lg bg-slate-800/80 border border-slate-700 text-white font-bold text-sm">
                <span className="font-sans flex items-center gap-2">
                  <span>5. Driver Net Payout ($):</span>
                  <span className="text-[11px] font-normal text-cyan-300 font-mono">
                    ({formatPercent(financials.driverShareRatio, 1)} Share)
                  </span>
                </span>
                <span className="text-cyan-300">{formatCurrency(financials.driverNetPayout)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Tesseract OCR Verification Audit */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Tesseract OCR Verification Audit Specs
              </span>
              {driver.isVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  ✓ Verified Driver
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  ⏳ Awaiting Dispatch
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] text-slate-400 block">Assigned Driver Name:</span>
                <p className="font-semibold text-white">{driver.name}</p>
                <span className="text-[11px] text-slate-400 block mt-1">Driving License (DL):</span>
                <p className="font-mono text-slate-300">{driver.licenseNumber}</p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Vehicle Registration (RC Plate):</span>
                <p className="font-mono font-bold text-white flex items-center gap-1.5">
                  <span>{driver.truckPlate}</span>
                  {isPlateValid ? (
                    <span className="text-[10px] text-emerald-400 font-sans">✓ Regex Match</span>
                  ) : (
                    <span className="text-[10px] text-red-400 font-sans">✕ Unverified Plate</span>
                  )}
                </p>
                <span className="text-[11px] text-slate-400 block mt-1">OCR Engine Audit Timestamp:</span>
                <p className="font-mono text-cyan-400 text-[11px]">
                  {driver.ocrAuditTimestamp} ({driver.ocrMatchScore}% Confidence)
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Settlement & Razorpay Telemetry */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-400" />
                Escrow & Payment Telemetry
              </span>
              <span className="font-mono text-xs text-slate-300">{paymentMethod}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
              <div>
                <span className="text-slate-400 block">Razorpay Order / Pay ID:</span>
                <span className="font-mono text-slate-200">{razorpayPaymentId || "rzp_test_escrow"}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Escrow Release Target:</span>
                <span className="font-mono text-slate-200">
                  {escrowReleaseDate ? new Date(escrowReleaseDate).toLocaleString() : "Upon GPS POD Confirmation"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Customer GSTIN:</span>
                <span className="font-mono text-slate-200">{customer.gstin || "27AAACT2727Q1ZW"}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            TRUCKIT Platform v2.4 • Cryptographically signed audit trail
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onDownloadReceipt?.(booking);
              }}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium shadow-md shadow-orange-500/20 transition-all"
            >
              Download Financial Receipt
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

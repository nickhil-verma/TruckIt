"use client";
import { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Eye, 
  Download, 
  MapPin, 
  Truck, 
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
  AlertTriangle
} from "lucide-react";
import { 
  formatCurrency, 
  formatPercent, 
  validateTruckPlate, 
  calculateBookingFinancials 
} from "@/lib/adminData";
import toast from "react-hot-toast";

export default function PerBookingLedger({
  bookings = [],
  activeTakeRate = 15,
  isGlobalTakeRate = false,
  onSelectBooking,
  onDownloadReceipt,
  onReleaseEscrow,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [fleetFilter, setFleetFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState("timestamp"); // timestamp, grossFare, platformCut, driverPayout, distanceKm
  const [sortDirection, setSortDirection] = useState("desc"); // asc, desc

  // Calculate dynamic financials if take-rate was adjusted globally
  const processedBookings = useMemo(() => {
    return bookings.map((b) => {
      if (isGlobalTakeRate && activeTakeRate !== b.financials.platformCutPercent) {
        const recalculated = calculateBookingFinancials(
          b.financials.baseFreightFare,
          b.financials.weightSurcharge,
          b.financials.fuelSurcharge,
          activeTakeRate
        );
        return {
          ...b,
          financials: recalculated,
        };
      }
      return b;
    });
  }, [bookings, activeTakeRate, isGlobalTakeRate]);

  // Filtering & Search
  const filteredBookings = useMemo(() => {
    return processedBookings.filter((b) => {
      // Search matching: ID, Customer name, Driver name, Route, Truck Plate
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        b.id.toLowerCase().includes(query) ||
        b.customer.name.toLowerCase().includes(query) ||
        b.driver.name.toLowerCase().includes(query) ||
        b.driver.truckPlate.toLowerCase().includes(query) ||
        b.route.origin.toLowerCase().includes(query) ||
        b.route.destination.toLowerCase().includes(query) ||
        b.fleetType.toLowerCase().includes(query);

      // Fleet filter
      const matchesFleet = fleetFilter === "All" || b.fleetType === fleetFilter;

      // Status filter
      const matchesStatus = statusFilter === "All" || b.settlementStatus === statusFilter;

      return matchesSearch && matchesFleet && matchesStatus;
    });
  }, [processedBookings, searchQuery, fleetFilter, statusFilter]);

  // Sorting
  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      let valA, valB;
      switch (sortKey) {
        case "grossFare":
          valA = a.financials.grossFare;
          valB = b.financials.grossFare;
          break;
        case "platformCut":
          valA = a.financials.platformCut;
          valB = b.financials.platformCut;
          break;
        case "driverPayout":
          valA = a.financials.driverNetPayout;
          valB = b.financials.driverNetPayout;
          break;
        case "distanceKm":
          valA = a.route.distanceKm;
          valB = b.route.distanceKm;
          break;
        case "timestamp":
        default:
          valA = new Date(a.timestamp).getTime();
          valB = new Date(b.timestamp).getTime();
          break;
      }
      return sortDirection === "asc" ? valA - valB : valB - valA;
    });
  }, [filteredBookings, sortKey, sortDirection]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "Booking ID",
      "Timestamp",
      "Customer",
      "Customer Tier",
      "Driver Name",
      "Driver Plate",
      "Plate Validated",
      "Origin",
      "Destination",
      "Distance (km)",
      "Fleet Type",
      "Gross Fare (₹)",
      "Statutory RTO (3%)",
      "Platform Cut (₹)",
      "Platform Cut (%)",
      "Driver Payout (₹)",
      "Driver Share (%)",
      "Settlement Status",
      "Razorpay ID",
    ];

    const rows = sortedBookings.map((b) => [
      b.id,
      b.timestamp,
      `"${b.customer.name}"`,
      b.customer.tier,
      `"${b.driver.name}"`,
      b.driver.truckPlate,
      validateTruckPlate(b.driver.truckPlate) ? "YES" : "NO",
      `"${b.route.origin}"`,
      `"${b.route.destination}"`,
      b.route.distanceKm,
      b.fleetType,
      b.financials.grossFare.toFixed(2),
      b.financials.statutorySurcharge.toFixed(2),
      b.financials.platformCut.toFixed(2),
      b.financials.platformCutPercent,
      b.financials.driverNetPayout.toFixed(2),
      b.financials.driverShareRatio.toFixed(1),
      b.settlementStatus,
      b.razorpayPaymentId || "",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TRUCKIT_Financial_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Financial ledger exported to CSV successfully!");
  };

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md overflow-hidden shadow-xl">
      
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-800/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Per-Booking Financial Ledger
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {sortedBookings.length} Audited Loads
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Granular per-trip fare breakdown, statutory surcharges, TRUCKIT take-rates, and escrow settlements.
            </p>
          </div>

          {/* Export Action */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1">
          
          {/* Search Input */}
          <div className="lg:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Booking #, Customer, Driver, Route, Plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
            />
          </div>

          {/* Fleet Filter */}
          <div className="lg:col-span-3">
            <div className="relative">
              <select
                aria-label="Filter by fleet category"
                value={fleetFilter}
                onChange={(e) => setFleetFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500/50 appearance-none cursor-pointer"
              >
                <option value="All">All Fleet Types</option>
                <option value="Heavy-Haul">Heavy-Haul (25T+)</option>
                <option value="Reefer">Reefer (Cold-Chain)</option>
                <option value="Medium">Medium Freight</option>
                <option value="Mini">Mini Express</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <div className="relative">
              <select
                aria-label="Filter by settlement status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500/50 appearance-none cursor-pointer"
              >
                <option value="All">All Settlement Statuses</option>
                <option value="Paid">Paid / Settled</option>
                <option value="Escrow Locked">Escrow Locked</option>
                <option value="Pending Release">Pending Release</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

      </div>

      {/* Responsive Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
              <th 
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort("timestamp")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Booking ID</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Customer Details</th>
              <th className="py-3.5 px-4">Assigned Driver & Plate</th>
              <th 
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort("distanceKm")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Route & Mileage</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort("grossFare")}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Gross Fare (₹)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort("platformCut")}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Platform Cut (₹)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort("driverPayout")}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Driver Payout (₹)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-center">Settlement Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedBookings.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Truck className="w-8 h-8 text-slate-600" />
                    <p className="text-sm font-medium">No booking records found</p>
                    <p className="text-xs text-slate-500">Try modifying your search or fleet filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedBookings.map((b) => {
                const isPlateValid = validateTruckPlate(b.driver.truckPlate);

                return (
                  <tr 
                    key={b.id}
                    className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    onClick={() => onSelectBooking?.(b)}
                  >
                    {/* 1. Booking ID & Timestamp */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-orange-400 text-sm">
                          #{b.id}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {new Date(b.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>

                    {/* 2. Customer Details */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="font-semibold text-white truncate" title={b.customer.name}>
                        {b.customer.name}
                      </div>
                      <span className={`inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                        b.customer.tier === "Enterprise Tier 1"
                          ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                          : b.customer.tier === "Strategic Partner"
                          ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}>
                        {b.customer.tier}
                      </span>
                    </td>

                    {/* 3. Assigned Driver & Verified Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          {b.driver.avatar ? (
                            <img
                              src={b.driver.avatar}
                              alt={b.driver.name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-700"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                              {b.driver.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-200">
                              {b.driver.name}
                            </span>
                            {/* Official Blue Tick Badge matching Tesseract OCR output */}
                            {b.driver.isVerified && (
                              <span 
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30"
                                title={`Tesseract OCR Verified: ${b.driver.ocrMatchScore}% Match`}
                              >
                                <span>✓</span>
                                <span>Verified Driver</span>
                              </span>
                            )}
                          </div>

                          {/* Truck Plate with Regex Validation */}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[11px] text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                              {b.driver.truckPlate}
                            </span>
                            {!isPlateValid && (
                              <span className="text-[10px] text-red-400 flex items-center gap-0.5" title="Non-standard plate regex">
                                <AlertTriangle className="w-3 h-3" />
                                Plate Unverified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 4. Route & Mileage */}
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <div className="flex items-center gap-1.5 text-slate-200 font-medium truncate">
                        <span className="truncate">{b.route.origin.split(",")[0]}</span>
                        <span className="text-slate-500">→</span>
                        <span className="truncate">{b.route.destination.split(",")[0]}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span className="text-cyan-400 font-mono font-medium">{b.route.distanceKm} km</span>
                        <span>•</span>
                        <span>{b.route.stopsCount} stop{b.route.stopsCount > 1 ? "s" : ""}</span>
                        <span>•</span>
                        <span className="text-slate-300">{b.fleetType}</span>
                      </div>
                    </td>

                    {/* 5. Gross Fare */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-bold text-white font-mono text-sm block">
                        {formatCurrency(b.financials.grossFare)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {b.tonnage} Tons Cargo
                      </span>
                    </td>

                    {/* 6. Platform Commission */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-bold text-emerald-400 font-mono text-sm block">
                        {formatCurrency(b.financials.platformCut)}
                      </span>
                      <span className="text-[10px] text-emerald-400/80 font-medium">
                        {b.financials.platformCutPercent}% Net Take
                      </span>
                    </td>

                    {/* 7. Driver Payout */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-bold text-slate-200 font-mono text-sm block">
                        {formatCurrency(b.financials.driverNetPayout)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatPercent(b.financials.driverShareRatio, 1)} Share
                      </span>
                    </td>

                    {/* 8. Settlement Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {b.settlementStatus === "Paid" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid</span>
                        </span>
                      )}
                      {b.settlementStatus === "Escrow Locked" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          <Lock className="w-3 h-3" />
                          <span>Escrow Locked</span>
                        </span>
                      )}
                      {b.settlementStatus === "Pending Release" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          <Clock className="w-3 h-3" />
                          <span>Pending Release</span>
                        </span>
                      )}
                    </td>

                    {/* 9. Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectBooking?.(b)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="View Financial Waterfall Breakdown"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownloadReceipt?.(b)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Download Receipt"
                        >
                          <Download className="w-3.5 h-3.5 text-orange-400" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Meta */}
      <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span>Showing <strong>{sortedBookings.length}</strong> of <strong>{bookings.length}</strong> total freight loads</span>
          {isGlobalTakeRate && (
            <span className="text-orange-400 text-[11px] font-medium">
              (Recalculated with Global Take-Rate: {activeTakeRate}%)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Statutory RTO Surcharge: 3.0% Deducted Prior to Cut</span>
          </span>
        </div>
      </div>

    </div>
  );
}

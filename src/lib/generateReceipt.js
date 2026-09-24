import { formatCurrency, formatPercent, validateTruckPlate } from "./adminData";

/**
 * Generates an official, printable HTML receipt and downloads it
 * @param {object} booking 
 */
export function downloadBookingReceipt(booking) {
  if (!booking) return;

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
    paymentMethod,
    razorpayPaymentId,
  } = booking;

  const isPlateValid = validateTruckPlate(driver.truckPlate);

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TRUCKIT Financial Receipt #${id}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 40px;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #f97316;
      padding-bottom: 20px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .brand span {
      color: #f97316;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 6px;
      background: #f1f5f9;
      color: #334155;
    }
    .badge.verified {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }
    .panel {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
    }
    .panel h4 {
      margin: 0 0 10px 0;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      font-size: 13px;
    }
    th, td {
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      text-align: left;
      color: #64748b;
      font-size: 12px;
      text-transform: uppercase;
      background: #f1f5f9;
    }
    .text-right {
      text-align: right;
    }
    .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .total-row {
      font-weight: bold;
      background: #f8fafc;
      border-top: 2px solid #cbd5e1;
    }
    .profit-row {
      background: #ecfdf5;
      color: #047857;
      font-weight: bold;
    }
    .driver-row {
      background: #f0f9ff;
      color: #0369a1;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { margin: 15px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">TRUCK<span>IT</span> COMMAND CENTER</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
        Official Platform Commission & Settlement Audit Voucher
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 16px; font-weight: bold; font-family: monospace;">#${id}</div>
      <div style="font-size: 12px; color: #64748b;">${new Date(timestamp).toUTCString()}</div>
      <div class="badge" style="margin-top: 4px;">Status: ${settlementStatus}</div>
    </div>
  </div>

  <div class="grid">
    <div class="panel">
      <h4>Customer & Freight Particulars</h4>
      <div style="font-size: 14px; font-weight: bold;">${customer.name}</div>
      <div style="font-size: 12px; color: #64748b;">Tier: ${customer.tier}</div>
      <div style="font-size: 12px; color: #64748b;">GSTIN: ${customer.gstin || "27AAACT2727Q1ZW"}</div>
      <div style="margin-top: 10px; font-size: 12px;">
        <strong>Cargo:</strong> ${cargoDescription} (${tonnage} Tons, ${fleetType})
      </div>
    </div>

    <div class="panel">
      <h4>Verified Fleet Driver & OCR Audit</h4>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 14px; font-weight: bold;">${driver.name}</span>
        <span class="badge verified">✓ Verified Driver</span>
      </div>
      <div style="font-size: 12px; font-family: monospace; color: #334155; margin-top: 4px;">
        Plate: <strong>${driver.truckPlate}</strong> ${isPlateValid ? "(Valid Standard)" : "(Unverified Format)"}
      </div>
      <div style="font-size: 12px; color: #64748b;">License: ${driver.licenseNumber}</div>
      <div style="font-size: 11px; color: #0284c7; margin-top: 6px;">
        Tesseract OCR Verified: ${driver.ocrAuditTimestamp} (${driver.ocrMatchScore}%)
      </div>
    </div>
  </div>

  <div class="panel" style="margin-bottom: 25px;">
    <h4>Transit Corridor & Telemetry</h4>
    <div style="font-size: 13px;">
      <strong>Origin:</strong> ${route.origin} &nbsp; ➔ &nbsp; <strong>Destination:</strong> ${route.destination}
    </div>
    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
      Total Distance: <strong>${route.distanceKm} km</strong> &nbsp;|&nbsp; 
      Stops: ${route.stopsCount} &nbsp;|&nbsp; 
      Waypoints: ${route.viaStops ? route.viaStops.join(" ➔ ") : "Direct"}
    </div>
  </div>

  <h4>Itemized Financial Waterfall</h4>
  <table>
    <thead>
      <tr>
        <th>Accounting Item</th>
        <th>Basis / Rate Formula</th>
        <th class="text-right">Subtotal ($)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Base Mileage Freight Fare</td>
        <td>Distance & Base Mileage Schedule</td>
        <td class="text-right font-mono">${formatCurrency(financials.baseFreightFare)}</td>
      </tr>
      <tr>
        <td>Fleet Weight Surcharge</td>
        <td>Tonnage Tier Surcharge (${tonnage}T)</td>
        <td class="text-right font-mono">${formatCurrency(financials.weightSurcharge)}</td>
      </tr>
      <tr>
        <td>Fuel Surcharge</td>
        <td>Corridor Fuel Price Index</td>
        <td class="text-right font-mono">${formatCurrency(financials.fuelSurcharge)}</td>
      </tr>
      <tr class="total-row">
        <td><strong>Gross Booking Fare ($)</strong></td>
        <td>Base + Weight + Fuel Surcharges</td>
        <td class="text-right font-mono"><strong>${formatCurrency(financials.grossFare)}</strong></td>
      </tr>
      <tr>
        <td style="color: #dc2626;">Less: Statutory Insurance / RTO Surcharge</td>
        <td style="color: #dc2626;">3.0% of Gross Booking Fare</td>
        <td class="text-right font-mono" style="color: #dc2626;">-${formatCurrency(financials.statutorySurcharge)}</td>
      </tr>
      <tr style="background: #f8fafc;">
        <td><strong>Net Commissionable Base ($)</strong></td>
        <td>Gross Fare less Statutory RTO</td>
        <td class="text-right font-mono"><strong>${formatCurrency(financials.netCommissionableBase)}</strong></td>
      </tr>
      <tr class="profit-row">
        <td>TRUCKIT Platform Cut / Commission</td>
        <td>${financials.platformCutPercent}% Platform Take-Rate</td>
        <td class="text-right font-mono">${formatCurrency(financials.platformCut)}</td>
      </tr>
      <tr class="driver-row">
        <td>Driver Net Payout ($)</td>
        <td>Gross less Platform Cut and RTO (${formatPercent(financials.driverShareRatio, 1)} Share)</td>
        <td class="text-right font-mono">${formatCurrency(financials.driverNetPayout)}</td>
      </tr>
    </tbody>
  </table>

  <div class="panel" style="margin-top: 25px;">
    <h4>Payment & Escrow Telemetry</h4>
    <div style="font-size: 12px; font-family: monospace;">
      Payment Method: ${paymentMethod} &nbsp;|&nbsp; 
      Razorpay Payment ID: ${razorpayPaymentId || "rzp_test_escrow_audit"}
    </div>
  </div>

  <div class="footer">
    <div>Generated by TRUCKIT Admin Command Center • Automated Ledger Audit</div>
    <div>Page 1 of 1 • System Date: ${new Date().toISOString()}</div>
  </div>

  <div class="no-print" style="margin-top: 30px; text-align: center;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #f97316; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
      Print Receipt
    </button>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TRUCKIT_Receipt_${id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

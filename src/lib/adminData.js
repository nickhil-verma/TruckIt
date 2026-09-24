/**
 * TRUCKIT Admin Command Center - Core Calculation Engine & Mock Datasets
 * Implements platform take-rate mathematical formulas, plate validation,
 * and comprehensive enterprise logistics financial records.
 */

// Regex for official Indian Truck Registration Plate format
export const TRUCK_PLATE_REGEX = /^[A-Z]{2}[ -]?[0-9]{2}[ -]?[A-Z]{1,2}[ -]?[0-9]{4}$/;

/**
 * Validates truck plate according to specification
 * @param {string} plate 
 * @returns {boolean}
 */
export function validateTruckPlate(plate) {
  if (!plate) return false;
  return TRUCK_PLATE_REGEX.test(plate.trim());
}

/**
 * Formats a numeric value into INR localized currency: ₹XX,XXX.XX
 * @param {number} amount 
 * @returns {string}
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a percentage value: e.g. 15.0%
 * @param {number} value 
 * @param {number} decimals 
 * @returns {string}
 */
export function formatPercent(value, decimals = 1) {
  if (value === undefined || value === null || isNaN(value)) return "0.0%";
  return `${value.toFixed(decimals)}%`;
}

/**
 * CORE MATHEMATICAL FORMULAS
 * 1. Gross Booking Fare (₹) = Base Mileage Rate + Fleet Weight Surcharge + Fuel Surcharge
 * 2. Statutory Insurance / RTO Surcharge (₹) = Gross Fare * 0.03 (3% default)
 * 3. Net Commissionable Base (₹) = Gross Fare - Statutory Surcharge
 * 4. TRUCKIT Platform Cut / Commission (₹) = Net Commissionable Base * (takeRatePercent / 100)
 * 5. Driver Net Payout (₹) = Gross Fare - Platform Cut - Statutory Surcharge
 * 6. Driver Commission Share Ratio = Driver Payout / Gross Fare * 100%
 */
export function calculateBookingFinancials(
  baseFreightFare,
  weightSurcharge,
  fuelSurcharge,
  takeRatePercent = 15,
  statutoryRate = 0.03
) {
  const grossFare = baseFreightFare + weightSurcharge + fuelSurcharge;
  const statutorySurcharge = Math.round(grossFare * statutoryRate * 100) / 100;
  const netCommissionableBase = Math.round((grossFare - statutorySurcharge) * 100) / 100;
  const platformCut = Math.round(netCommissionableBase * (takeRatePercent / 100) * 100) / 100;
  const driverNetPayout = Math.round((grossFare - platformCut - statutorySurcharge) * 100) / 100;
  const driverShareRatio = grossFare > 0 ? (driverNetPayout / grossFare) * 100 : 0;

  return {
    baseFreightFare,
    weightSurcharge,
    fuelSurcharge,
    grossFare,
    statutorySurcharge,
    netCommissionableBase,
    platformCut,
    platformCutPercent: takeRatePercent,
    driverNetPayout,
    driverShareRatio,
  };
}

/**
 * Dynamic Commission Take-Rate Simulation
 * Models projected 30-day profit, driver take-home yield, and customer booking volume elasticity
 */
export function simulateTakeRateImpact(baselineGmv, takeRatePercent) {
  // Baseline assumption: at standard 15%, elasticity factor is 1.0 (neutral)
  // Higher take-rate (> 15%) slightly decreases volume elasticity due to platform markups
  // Lower take-rate (< 15%) encourages volume growth due to competitive pricing
  const baselineRate = 15.0;
  const rateDelta = takeRatePercent - baselineRate;

  // Elasticity curve: -0.8% volume per +1% commission increase
  const volumeElasticity = Math.round((1 - (rateDelta * 0.008)) * 1000) / 10; // percentage, e.g. 98.4%
  const elasticityDeltaPercent = Math.round((volumeElasticity - 100) * 10) / 10;

  const adjusted30DayGmv = baselineGmv * (volumeElasticity / 100);
  const statutorySurchargeTotal = adjusted30DayGmv * 0.03;
  const commissionableBase = adjusted30DayGmv - statutorySurchargeTotal;
  const projected30DayProfit = commissionableBase * (takeRatePercent / 100);

  // Driver take home yield across platform
  const driverDisbursement = adjusted30DayGmv - projected30DayProfit - statutorySurchargeTotal;
  const driverTakeHomeYieldPercent = (driverDisbursement / adjusted30DayGmv) * 100;

  return {
    takeRatePercent,
    projected30DayProfit,
    driverTakeHomeYieldPercent,
    projectedVolumeElasticityPercent: elasticityDeltaPercent,
    projectedGmv: adjusted30DayGmv,
  };
}

// ─── INITIAL MOCK DATASETS ───────────────────────────────────────────────────

export const INITIAL_BOOKING_RECORDS = [
  {
    id: "TRK-9821",
    timestamp: "2026-09-24T18:45:00Z",
    customer: {
      name: "Tata Logistics & Supply",
      tier: "Enterprise Tier 1",
      gstin: "27AAACT2727Q1ZW",
      contactPerson: "Rajiv Singhania (Head of Procurement)",
    },
    driver: {
      id: "DRV-1001",
      name: "Balwinder Singh",
      avatar: "https://images.unsplash.com/photo-1583195764036-6dc248ac07d9?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      truckPlate: "MH 12 AB 4589",
      licenseNumber: "MH-1420180092110",
      rating: 4.94,
      ocrAuditTimestamp: "2026-03-12 14:22:10 UTC",
      ocrMatchScore: 99.4,
    },
    route: {
      origin: "JNPT Port, Navi Mumbai",
      destination: "Okhla Phase III, New Delhi",
      distanceKm: 1420,
      stopsCount: 3,
      viaStops: ["Surat Hub", "Jaipur Logistic Park", "Gurugram Central"],
      geometryPoints: 84,
    },
    fleetType: "Heavy-Haul",
    cargoDescription: "Precision Automotive Engine Blocks & Alloy Castings",
    tonnage: 34.5,
    financials: calculateBookingFinancials(3400.0, 750.0, 350.0, 15),
    settlementStatus: "Paid",
    escrowReleaseDate: "2026-09-24T19:30:00Z",
    paymentMethod: "Razorpay Escrow",
    razorpayPaymentId: "pay_Rzp9821TataJNPT",
  },
  {
    id: "TRK-9822",
    timestamp: "2026-09-24T16:15:00Z",
    customer: {
      name: "ITC Cold-Chain FMCG",
      tier: "Enterprise Tier 1",
      gstin: "19AAACI1122R1ZT",
      contactPerson: "Sunita Menon (Cold Logistics VP)",
    },
    driver: {
      id: "DRV-1004",
      name: "Gurpreet Dhillon",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      truckPlate: "DL 01 A 9821",
      licenseNumber: "DL-0120190048123",
      rating: 4.88,
      ocrAuditTimestamp: "2026-04-05 09:11:42 UTC",
      ocrMatchScore: 98.7,
    },
    route: {
      origin: "Chandigarh Agri Hub",
      destination: "Whitefield, Bengaluru",
      distanceKm: 2380,
      stopsCount: 4,
      viaStops: ["Delhi Bypass", "Bhopal Gateway", "Hyderabad North", "Hosur Border"],
      geometryPoints: 112,
    },
    fleetType: "Reefer",
    cargoDescription: "Sub-Zero Dairy, Gourmet Butter & Farm Frozen Berries (-18°C)",
    tonnage: 22.0,
    financials: calculateBookingFinancials(4200.0, 920.0, 680.0, 15),
    settlementStatus: "Escrow Locked",
    escrowReleaseDate: "2026-09-26T12:00:00Z",
    paymentMethod: "Razorpay Escrow",
    razorpayPaymentId: "pay_Rzp9822ITCCold",
  },
  {
    id: "TRK-9823",
    timestamp: "2026-09-24T14:30:00Z",
    customer: {
      name: "Reliance Retail MegaStores",
      tier: "Enterprise Tier 1",
      gstin: "24AAACR4411Q1ZX",
      contactPerson: "Amitabh Ghosh (Supply Chain Lead)",
    },
    driver: {
      id: "DRV-1002",
      name: "Arjun Verma",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      truckPlate: "GJ 06 BC 3419",
      licenseNumber: "GJ-0620200031984",
      rating: 4.91,
      ocrAuditTimestamp: "2026-02-18 16:45:00 UTC",
      ocrMatchScore: 99.8,
    },
    route: {
      origin: "Ahmedabad GIDC Estate",
      destination: "Sriperumbudur Industrial Hub, Chennai",
      distanceKm: 1670,
      stopsCount: 2,
      viaStops: ["Pune Chakan Hub", "Bengaluru Electronic City"],
      geometryPoints: 95,
    },
    fleetType: "Heavy-Haul",
    cargoDescription: "Commercial Solar Inverters & Energy Storage Modules",
    tonnage: 28.0,
    financials: calculateBookingFinancials(3100.0, 680.0, 420.0, 15),
    settlementStatus: "Pending Release",
    escrowReleaseDate: "2026-09-25T08:00:00Z",
    paymentMethod: "Corporate Wire",
    razorpayPaymentId: "pay_Rzp9823RelGJ",
  },
  {
    id: "TRK-9824",
    timestamp: "2026-09-24T11:20:00Z",
    customer: {
      name: "Flipkart Fulfillment Centers",
      tier: "Strategic Partner",
      gstin: "29AABCU9603R1ZM",
      contactPerson: "Priya Sundaram (Intercity Freight Dir)",
    },
    driver: {
      id: "DRV-1005",
      name: "Rameshwar Yadav",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      truckPlate: "KA 04 E 7732",
      licenseNumber: "KA-0420170065412",
      rating: 4.96,
      ocrAuditTimestamp: "2026-01-29 11:20:15 UTC",
      ocrMatchScore: 99.2,
    },
    route: {
      origin: "Malur Fulfilment Center, Karnataka",
      destination: "Bhiwandi Logistic Park, Thane",
      distanceKm: 1040,
      stopsCount: 2,
      viaStops: ["Belagavi Bypass", "Satara Highway Rest"],
      geometryPoints: 72,
    },
    fleetType: "Medium",
    cargoDescription: "Palletized E-Commerce Fast Movers & Consumer Electronics",
    tonnage: 14.5,
    financials: calculateBookingFinancials(1850.0, 320.0, 230.0, 15),
    settlementStatus: "Paid",
    escrowReleaseDate: "2026-09-24T13:40:00Z",
    paymentMethod: "Razorpay Escrow",
    razorpayPaymentId: "pay_Rzp9824FlipkartKA",
  },
  {
    id: "TRK-9825",
    timestamp: "2026-09-24T08:05:00Z",
    customer: {
      name: "Mahindra Heavy Vehicles Spares",
      tier: "Enterprise Tier 2",
      gstin: "27AABCM3300P1ZU",
      contactPerson: "Vikram Kulkarni (Distribution Manager)",
    },
    driver: {
      id: "DRV-1003",
      name: "Karthik Nambiar",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      truckPlate: "TN 09 AF 8820",
      licenseNumber: "TN-0920190019283",
      rating: 4.82,
      ocrAuditTimestamp: "2026-05-14 13:05:33 UTC",
      ocrMatchScore: 98.4,
    },
    route: {
      origin: "Zaheerabad Plant, Telangana",
      destination: "Chakan Industrial Zone, Pune",
      distanceKm: 510,
      stopsCount: 1,
      viaStops: ["Solapur Toll Plaza"],
      geometryPoints: 46,
    },
    fleetType: "Medium",
    cargoDescription: "Tractor Transmission Assemblies & Hydraulic Cylinder Kits",
    tonnage: 12.0,
    financials: calculateBookingFinancials(1150.0, 210.0, 140.0, 15),
    settlementStatus: "Paid",
    escrowReleaseDate: "2026-09-24T10:15:00Z",
    paymentMethod: "Direct Freight Credit",
    razorpayPaymentId: "pay_Rzp9825MahTN",
  },
  {
    id: "TRK-9826",
    timestamp: "2026-09-23T22:40:00Z",
    customer: {
      name: "Adani Logistics Multimodal",
      tier: "Strategic Partner",
      gstin: "24AAACA8899K1ZV",
      contactPerson: "Hardik Patel (Head of Container Freight)",
    },
    driver: {
      id: "DRV-1006",
      name: "Jaswinder Brar",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      truckPlate: "HR 26 DQ 5501",
      licenseNumber: "HR-2620160081290",
      rating: 4.97,
      ocrAuditTimestamp: "2026-03-30 17:35:12 UTC",
      ocrMatchScore: 99.6,
    },
    route: {
      origin: "Mundra Port Terminal, Gujarat",
      destination: "Pithampur Special Economic Zone, Indore",
      distanceKm: 785,
      stopsCount: 2,
      viaStops: ["Gandhidham", "Godhra Junction"],
      geometryPoints: 58,
    },
    fleetType: "Heavy-Haul",
    cargoDescription: "Imported Steel Coils & Marine Engineering Components",
    tonnage: 38.0,
    financials: calculateBookingFinancials(2450.0, 620.0, 330.0, 15),
    settlementStatus: "Escrow Locked",
    escrowReleaseDate: "2026-09-25T18:00:00Z",
    paymentMethod: "Razorpay Escrow",
    razorpayPaymentId: "pay_Rzp9826AdaniHR",
  },
  {
    id: "TRK-9827",
    timestamp: "2026-09-23T19:15:00Z",
    customer: {
      name: "QuickExpress Express Distribution",
      tier: "Standard Business",
      gstin: "07AAACQ3190L1ZS",
      contactPerson: "Ananya Roy (Logistics Controller)",
    },
    driver: {
      id: "DRV-1007",
      name: "Mohd. Shakeel",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      truckPlate: "UP 14 CZ 6214",
      licenseNumber: "UP-1420210041289",
      rating: 4.79,
      ocrAuditTimestamp: "2026-06-02 08:44:00 UTC",
      ocrMatchScore: 97.9,
    },
    route: {
      origin: "Noida Sector 63 Logistics Hub",
      destination: "Kanpur Transport Nagar",
      distanceKm: 460,
      stopsCount: 1,
      viaStops: ["Yamuna Expressway Toll"],
      geometryPoints: 38,
    },
    fleetType: "Mini",
    cargoDescription: "Pharmaceutical Secondary Packaging & Clinical Supplies",
    tonnage: 4.2,
    financials: calculateBookingFinancials(680.0, 90.0, 80.0, 15),
    settlementStatus: "Paid",
    escrowReleaseDate: "2026-09-23T21:00:00Z",
    paymentMethod: "Razorpay Escrow",
    razorpayPaymentId: "pay_Rzp9827QuickUP",
  },
  {
    id: "TRK-9828",
    timestamp: "2026-09-23T15:00:00Z",
    customer: {
      name: "Jindal Steel & Power Ltd",
      tier: "Enterprise Tier 1",
      gstin: "22AAACJ9911N1ZP",
      contactPerson: "Dhiren Mishra (VP Fleet Movement)",
    },
    driver: {
      id: "DRV-1008",
      name: "Subhashis Mukherjee",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      truckPlate: "WB 19 M 4092",
      licenseNumber: "WB-1920150073211",
      rating: 4.93,
      ocrAuditTimestamp: "2026-02-11 15:20:10 UTC",
      ocrMatchScore: 99.5,
    },
    route: {
      origin: "Raigarh Steel Works, Chhattisgarh",
      destination: "Haldia International Dock, West Bengal",
      distanceKm: 620,
      stopsCount: 2,
      viaStops: ["Jharsuguda Junction", "Kharagpur Freight Corridor"],
      geometryPoints: 50,
    },
    fleetType: "Heavy-Haul",
    cargoDescription: "Heavy Structural Girder Beams & Industrial Rail Profiles",
    tonnage: 42.0,
    financials: calculateBookingFinancials(2800.0, 780.0, 360.0, 15),
    settlementStatus: "Pending Release",
    escrowReleaseDate: "2026-09-24T23:59:00Z",
    paymentMethod: "Corporate Wire",
    razorpayPaymentId: "pay_Rzp9828JindalWB",
  },
];

export const INITIAL_DRIVER_FINANCIALS = [
  {
    id: "DRV-1001",
    name: "Balwinder Singh",
    truckPlate: "MH 12 AB 4589",
    fleetType: "Heavy-Haul",
    isVerified: true,
    tripsCompleted: 142,
    lifetimeGrossGenerated: 384250.0,
    totalPlatformCutContributed: 55908.0,
    pendingWithdrawalBalance: 7840.5,
    rating: 4.94,
    status: "Active on Highway",
  },
  {
    id: "DRV-1004",
    name: "Gurpreet Dhillon",
    truckPlate: "DL 01 A 9821",
    fleetType: "Reefer",
    isVerified: true,
    tripsCompleted: 98,
    lifetimeGrossGenerated: 442100.0,
    totalPlatformCutContributed: 64325.0,
    pendingWithdrawalBalance: 12480.0,
    rating: 4.88,
    status: "Active on Highway",
  },
  {
    id: "DRV-1002",
    name: "Arjun Verma",
    truckPlate: "GJ 06 BC 3419",
    fleetType: "Heavy-Haul",
    isVerified: true,
    tripsCompleted: 119,
    lifetimeGrossGenerated: 320900.0,
    totalPlatformCutContributed: 46690.0,
    pendingWithdrawalBalance: 3620.0,
    rating: 4.91,
    status: "Available at Hub",
  },
  {
    id: "DRV-1005",
    name: "Rameshwar Yadav",
    truckPlate: "KA 04 E 7732",
    fleetType: "Medium",
    isVerified: true,
    tripsCompleted: 164,
    lifetimeGrossGenerated: 278400.0,
    totalPlatformCutContributed: 40507.0,
    pendingWithdrawalBalance: 5120.0,
    rating: 4.96,
    status: "Active on Highway",
  },
  {
    id: "DRV-1006",
    name: "Jaswinder Brar",
    truckPlate: "HR 26 DQ 5501",
    fleetType: "Heavy-Haul",
    isVerified: true,
    tripsCompleted: 130,
    lifetimeGrossGenerated: 361500.0,
    totalPlatformCutContributed: 52598.0,
    pendingWithdrawalBalance: 8940.0,
    rating: 4.97,
    status: "Available at Hub",
  },
  {
    id: "DRV-1008",
    name: "Subhashis Mukherjee",
    truckPlate: "WB 19 M 4092",
    fleetType: "Heavy-Haul",
    isVerified: true,
    tripsCompleted: 87,
    lifetimeGrossGenerated: 298100.0,
    totalPlatformCutContributed: 43373.0,
    pendingWithdrawalBalance: 6450.0,
    rating: 4.93,
    status: "Available at Hub",
  },
  {
    id: "DRV-1003",
    name: "Karthik Nambiar",
    truckPlate: "TN 09 AF 8820",
    fleetType: "Medium",
    isVerified: true,
    tripsCompleted: 76,
    lifetimeGrossGenerated: 148900.0,
    totalPlatformCutContributed: 21665.0,
    pendingWithdrawalBalance: 2190.0,
    rating: 4.82,
    status: "Off-Duty",
  },
  {
    id: "DRV-1007",
    name: "Mohd. Shakeel",
    truckPlate: "UP 14 CZ 6214",
    fleetType: "Mini",
    isVerified: true,
    tripsCompleted: 105,
    lifetimeGrossGenerated: 94200.0,
    totalPlatformCutContributed: 13706.0,
    pendingWithdrawalBalance: 1450.0,
    rating: 4.79,
    status: "Off-Duty",
  },
];

export const INITIAL_CUSTOMER_MARGINS = [
  {
    id: "CUST-001",
    enterpriseName: "Tata Logistics & Supply",
    tier: "Enterprise Tier 1",
    activeContracts: 18,
    totalVolumeBooked: 248,
    avgCommissionMarginAchieved: 14.8,
    discountBracket: "Volume Tier A (8% Discount Applied)",
    preferredFleet: "Heavy-Haul",
    totalFreightSpend: 784200.0,
  },
  {
    id: "CUST-002",
    enterpriseName: "Reliance Retail MegaStores",
    tier: "Enterprise Tier 1",
    activeContracts: 24,
    totalVolumeBooked: 312,
    avgCommissionMarginAchieved: 14.6,
    discountBracket: "Volume Tier A (10% Discount Applied)",
    preferredFleet: "Heavy-Haul",
    totalFreightSpend: 920500.0,
  },
  {
    id: "CUST-003",
    enterpriseName: "ITC Cold-Chain FMCG",
    tier: "Enterprise Tier 1",
    activeContracts: 14,
    totalVolumeBooked: 165,
    avgCommissionMarginAchieved: 15.2,
    discountBracket: "Cold-Chain Premium (5% Discount Applied)",
    preferredFleet: "Reefer",
    totalFreightSpend: 642000.0,
  },
  {
    id: "CUST-004",
    enterpriseName: "Flipkart Fulfillment Centers",
    tier: "Strategic Partner",
    activeContracts: 32,
    totalVolumeBooked: 420,
    avgCommissionMarginAchieved: 13.9,
    discountBracket: "Platform Anchor (12% Discount Applied)",
    preferredFleet: "Medium",
    totalFreightSpend: 810400.0,
  },
  {
    id: "CUST-005",
    enterpriseName: "Adani Logistics Multimodal",
    tier: "Strategic Partner",
    activeContracts: 19,
    totalVolumeBooked: 195,
    avgCommissionMarginAchieved: 14.9,
    discountBracket: "Port Transit Agreement (7% Discount Applied)",
    preferredFleet: "Heavy-Haul",
    totalFreightSpend: 590000.0,
  },
  {
    id: "CUST-006",
    enterpriseName: "Jindal Steel & Power Ltd",
    tier: "Enterprise Tier 1",
    activeContracts: 11,
    totalVolumeBooked: 134,
    avgCommissionMarginAchieved: 15.1,
    discountBracket: "Industrial Bulk (6% Discount Applied)",
    preferredFleet: "Heavy-Haul",
    totalFreightSpend: 485000.0,
  },
];

export const INITIAL_FINANCIAL_SUMMARY = {
  gmv: 4232100.0,
  gmvWeeklyChangePercent: 18.4,
  platformNetRevenue: 615770.0,
  driverDisbursedEarnings: 3489370.0,
  activeVerifiedFleetRatio: {
    verified: 28,
    total: 32,
    percentage: 87.5,
  },
  effectiveTakeRate: 15.0,
  pendingEscrowTotal: 126960.0,
};

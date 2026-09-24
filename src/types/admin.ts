/**
 * TRUCKIT Admin Command Center - Type Definitions
 * Core financial entities, audit telemetry, and margin tracking.
 */

export type FleetType = "Heavy-Haul" | "Reefer" | "Medium" | "Mini";

export type SettlementStatus = "Paid" | "Escrow Locked" | "Pending Release";

export type EnterpriseTier = "Enterprise Tier 1" | "Enterprise Tier 2" | "Strategic Partner" | "Standard Business";

export interface RouteStop {
  city: string;
  hub: string;
  type: "origin" | "transit" | "destination";
  distanceFromPrevKm?: number;
}

export interface FinancialWaterfall {
  baseFreightFare: number;
  weightSurcharge: number;
  fuelSurcharge: number;
  grossFare: number;
  statutorySurcharge: number; // 3% Statutory Insurance / RTO
  netCommissionableBase: number;
  platformCut: number;
  platformCutPercent: number;
  driverNetPayout: number;
  driverShareRatio: number; // %
}

export interface BookingRecord {
  id: string; // e.g. TRK-9821
  timestamp: string; // ISO date string
  customer: {
    name: string;
    tier: EnterpriseTier;
    gstin?: string;
    contactPerson?: string;
  };
  driver: {
    id: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
    truckPlate: string; // matches ^[A-Z]{2}[ -]?[0-9]{2}[ -]?[A-Z]{1,2}[ -]?[0-9]{4}$
    licenseNumber: string;
    rating: number;
    ocrAuditTimestamp: string;
    ocrMatchScore: number; // percentage, e.g. 99.4
  };
  route: {
    origin: string;
    destination: string;
    distanceKm: number;
    stopsCount: number;
    viaStops: string[];
    geometryPoints?: number;
  };
  fleetType: FleetType;
  cargoDescription: string;
  tonnage: number;
  financials: FinancialWaterfall;
  settlementStatus: SettlementStatus;
  escrowReleaseDate?: string;
  paymentMethod: "Razorpay Escrow" | "Corporate Wire" | "Direct Freight Credit";
  razorpayPaymentId?: string;
}

export interface DriverFinancials {
  id: string;
  name: string;
  truckPlate: string;
  fleetType: FleetType;
  isVerified: boolean;
  tripsCompleted: number;
  lifetimeGrossGenerated: number;
  totalPlatformCutContributed: number;
  pendingWithdrawalBalance: number;
  rating: number;
  status: "Active on Highway" | "Available at Hub" | "Off-Duty";
}

export interface CustomerMargin {
  id: string;
  enterpriseName: string;
  tier: EnterpriseTier;
  activeContracts: number;
  totalVolumeBooked: number;
  avgCommissionMarginAchieved: number; // %
  discountBracket: string; // e.g. "12% Enterprise Discount"
  preferredFleet: FleetType;
  totalFreightSpend: number;
}

export interface FinancialSummary {
  gmv: number;
  gmvWeeklyChangePercent: number;
  platformNetRevenue: number;
  driverDisbursedEarnings: number;
  activeVerifiedFleetRatio: {
    verified: number;
    total: number;
    percentage: number;
  };
  effectiveTakeRate: number; // %
  pendingEscrowTotal: number;
}

export interface TakeRateSimulation {
  takeRatePercent: number; // 8% to 25%
  isGlobalApplied: boolean;
  projected30DayProfit: number;
  driverTakeHomeYieldPercent: number;
  projectedVolumeElasticityPercent: number;
}

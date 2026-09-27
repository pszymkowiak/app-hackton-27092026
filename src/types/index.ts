export type Language = 'en' | 'es' | 'fr';
export type UnitSystem = 'imperial' | 'metric';

export interface CountryConfig {
  code: string; // 'FR', 'US', 'CA', 'GB', 'DE', 'ES', 'BE', 'CH', 'MX', 'AU'
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  defaultUnits: UnitSystem;
  defaultStrength: string;
  availableStrengths: string[];
  phoneCode: string;
  cityExamples: string[];
}

export interface Point {
  x: number;
  y: number;
}

export interface OutlineResult {
  polygon: Point[];
  confidence: number;
  reason: string;
  roughEstimate?: {
    estimatedLengthFt?: number;
    estimatedWidthFt?: number;
    referenceClues?: string;
  };
}

export type ScaleMode = 'mark_known' | 'manual_dims';

export interface ScaleConfig {
  mode: ScaleMode;
  pointA: Point | null;
  pointB: Point | null;
  realLength: number; // in feet (imperial) or meters (metric)
  manualLength: number;
  manualWidth: number;
  computedAreaSqFt: number;
  computedAreaSqM: number;
  source: 'photo_reference' | 'manual_dimensions' | 'gemini_estimate';
}

export interface ConcreteMix {
  strength: string; // e.g. "C25/30", "4000 PSI", "30 MPa", "HA-25"
  slump: string;
  maxAggregate: string;
  airEntrained: boolean;
  fibers: boolean;
  placement: 'chute' | 'pump' | 'wheelbarrow';
}

export interface TruckItem {
  truckNumber: number;
  volumeYd3: number;
  volumeM3: number;
  status: 'preparing' | 'concrete_ok' | 'on_the_way' | 'delivering' | 'finished' | 'returning';
  batchTime: number | null; // epoch ms
  departTime: number | null;
  arrivalTime: number | null;
  finishTime: number | null;
  etaMinutes: number;
  waitingMinutesIncurred: number;
  waitingFeeIncurred: number;
}

export interface Supplier {
  id: string;
  name: string;
  country: string; // 'FR', 'US', etc.
  currency: string;
  currencySymbol: string;
  pricePerYd3: number;
  pricePerM3: number;
  truckCapacityYd3: number;
  truckCapacityM3: number;
  freeUnloadMinutes: number;
  waitingFeePerMin: number;
  shortLoadFee: number;
  returnedConcreteFee: number;
  lateCancelFee: number;
  rating: number;
  phone: string;
  location: string;
  badge?: string;
}

export interface SiteChecklist {
  formsSetAndBraced: boolean;
  rebarMeshInPlace: boolean;
  subgradeCompacted: boolean;
  inspectionPassed: boolean;
  crewOnSite: boolean;
  pumpBooked: boolean;
  truckAccessOk: boolean;
  acknowledgedWarning: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  createdAt: string;
}

export interface OrderRecord {
  id: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  status: 'confirmed' | 'preparing' | 'in_progress' | 'completed' | 'cancelled';
  country: string;
  currency: string;
  currencySymbol: string;
  customerName: string;
  customerPhone: string;
  address: string;
  accessNotes: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
  deliveryFlexDays?: number; // 1 to 90 days for Pourwise Share pool
  poolDiscountPercent?: number;
  poolSavings?: number;
  supplierId: string;
  supplierName: string;
  concreteMix: ConcreteMix;
  areaSqFt: number;
  areaSqM: number;
  depthInches: number;
  depthCm: number;
  baseVolumeYd3: number;
  baseVolumeM3: number;
  wastePercent: number;
  finalVolumeYd3: number;
  finalVolumeM3: number;
  manualOverride: boolean;
  truckloadsCount: number;
  trucks: TruckItem[];
  pricing: {
    concreteCost: number;
    deliveryFee: number;
    shortLoadFee: number;
    depositPaid: number;
    totalEstimated: number;
  };
  checklist: SiteChecklist;
  penaltiesUnderstood: boolean;
  actualLeftoverYd3?: number;
  recapCompleted?: boolean;
}

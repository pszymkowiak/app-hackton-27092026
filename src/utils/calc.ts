import type { Point, UnitSystem } from '../types/index.ts';

/**
 * Calculates the polygon area using Shoelace formula on normalized coordinates [0, 1].
 */
export function calculateNormalizedPolygonArea(points: Point[]): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Computes real-world area from polygon and marked reference points.
 * @param polygon Points in [0, 1] normalized space
 * @param p1 First scale point [0, 1]
 * @param p2 Second scale point [0, 1]
 * @param realLength Real length in feet (if imperial) or meters (if metric)
 * @param imageAspect Aspect ratio of image (width / height)
 * @param units 'imperial' or 'metric'
 */
export function calculateAreaFromScale(
  polygon: Point[],
  p1: Point,
  p2: Point,
  realLength: number,
  imageAspect: number = 4 / 3,
  units: UnitSystem = 'imperial'
): { sqFt: number; sqM: number } {
  if (polygon.length < 3 || realLength <= 0) {
    return { sqFt: 0, sqM: 0 };
  }

  // Account for image aspect ratio when calculating Euclidean distance
  // Let virtual width = 1000, height = 1000 / imageAspect
  const vw = 1000;
  const vh = 1000 / imageAspect;

  const dx = (p2.x - p1.x) * vw;
  const dy = (p2.y - p1.y) * vh;
  const pixelDist = Math.hypot(dx, dy);

  if (pixelDist === 0) return { sqFt: 0, sqM: 0 };

  const normArea = calculateNormalizedPolygonArea(polygon);
  const pixelArea = normArea * (vw * vh);

  // Each unit corresponds to (pixelDist / realLength) pixels
  const pixelsPerUnit = pixelDist / realLength;
  const areaInUnits = pixelArea / (pixelsPerUnit * pixelsPerUnit);

  if (units === 'imperial') {
    const sqFt = Math.max(0, areaInUnits);
    const sqM = sqFt * 0.092903;
    return { sqFt, sqM };
  } else {
    const sqM = Math.max(0, areaInUnits);
    const sqFt = sqM / 0.092903;
    return { sqFt, sqM };
  }
}

/**
 * Computes volume from area and depth.
 * Imperial: Area (sq ft) × (Depth in inches / 12) = cu ft; cu ft / 27 = cu yd.
 * Metric: Area (sq m) × (Depth in cm / 100) = cu m.
 */
export function calculateVolumes(
  areaSqFt: number,
  depthInches: number,
  wastePercent: number,
  truckCapacityYd3: number = 10,
  manualOverrideYd3: number | null = null
) {
  const depthFt = depthInches / 12;
  const baseCuFt = areaSqFt * depthFt;
  const baseVolumeYd3 = baseCuFt / 27;

  const areaSqM = areaSqFt * 0.092903;
  const depthCm = depthInches * 2.54;
  const baseVolumeM3 = areaSqM * (depthCm / 100);

  // Waste allowance
  const calculatedFinalYd3 = baseVolumeYd3 * (1 + wastePercent / 100);
  const calculatedFinalM3 = baseVolumeM3 * (1 + wastePercent / 100);

  // Rounding:
  // Imperial: round up to nearest 0.25 yd3
  const roundedFinalYd3 = Math.ceil(calculatedFinalYd3 * 4) / 4;
  // Metric: round up to nearest 0.5 m3
  const roundedFinalM3 = Math.ceil(calculatedFinalM3 * 2) / 2;

  const finalYd3 = manualOverrideYd3 !== null && manualOverrideYd3 > 0 ? manualOverrideYd3 : roundedFinalYd3;
  const finalM3 = finalYd3 * 0.764555;

  return {
    baseVolumeYd3,
    baseVolumeM3,
    calculatedFinalYd3,
    calculatedFinalM3,
    roundedFinalYd3,
    roundedFinalM3,
    finalYd3,
    finalM3,
  };
}

/**
 * Splits volume into truckloads and detects short loads.
 */
export function splitTruckloads(
  totalVolumeYd3: number,
  truckCapacityYd3: number = 10,
  forceBalanced: boolean = false
): {
  trucks: Array<{ truckNumber: number; volumeYd3: number; volumeM3: number }>;
  isShortLoad: boolean;
  canBalance: boolean;
  shortLoadTruckIndex: number | null;
} {
  if (totalVolumeYd3 <= 0) {
    return { trucks: [], isShortLoad: false, canBalance: false, shortLoadTruckIndex: null };
  }

  const numTrucks = Math.ceil(totalVolumeYd3 / truckCapacityYd3);

  if (forceBalanced && numTrucks > 1) {
    // Distribute total volume evenly across the trucks
    const perTruckYd3 = Math.round((totalVolumeYd3 / numTrucks) * 4) / 4;
    const trucks = [];
    let remaining = totalVolumeYd3;

    for (let i = 1; i <= numTrucks; i++) {
      const vol = i === numTrucks ? Math.round(remaining * 4) / 4 : perTruckYd3;
      remaining -= vol;
      trucks.push({
        truckNumber: i,
        volumeYd3: Math.max(0.25, vol),
        volumeM3: Math.round(vol * 0.764555 * 10) / 10,
      });
    }

    const lastTruck = trucks[trucks.length - 1];
    const isShortLoad = lastTruck ? lastTruck.volumeYd3 < 5 : false;

    return {
      trucks,
      isShortLoad,
      canBalance: false,
      shortLoadTruckIndex: isShortLoad ? trucks.length - 1 : null,
    };
  }

  // Standard sequential packing: fill trucks up to capacity
  const trucks = [];
  let remaining = totalVolumeYd3;
  let truckIndex = 1;

  while (remaining > 0) {
    const vol = Math.min(remaining, truckCapacityYd3);
    const roundedVol = Math.round(vol * 100) / 100;
    trucks.push({
      truckNumber: truckIndex,
      volumeYd3: roundedVol,
      volumeM3: Math.round(roundedVol * 0.764555 * 10) / 10,
    });
    remaining = Math.round((remaining - vol) * 100) / 100;
    truckIndex++;
  }

  const lastTruck = trucks[trucks.length - 1];
  const isShortLoad = trucks.length > 1 && lastTruck ? lastTruck.volumeYd3 < 5 : (trucks.length === 1 && lastTruck ? lastTruck.volumeYd3 < 3.5 : false);
  const canBalance = trucks.length > 1 && isShortLoad;

  return {
    trucks,
    isShortLoad,
    canBalance,
    shortLoadTruckIndex: isShortLoad ? trucks.length - 1 : null,
  };
}

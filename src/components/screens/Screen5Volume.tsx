import React, { useState } from 'react';
import { Box, AlertTriangle, Scale, Check, ArrowRight, ArrowLeft, RefreshCw, Sliders } from 'lucide-react';
import type { Language, UnitSystem, ScaleConfig } from '../../types/index.ts';
import { t } from '../../utils/i18n.ts';
import { calculateVolumes, splitTruckloads } from '../../utils/calc.ts';

interface Screen5VolumeProps {
  language: Language;
  units: UnitSystem;
  scaleConfig: ScaleConfig;
  depthInches: number;
  wastePercent: number;
  onWasteChanged: (waste: number) => void;
  truckCapacityYd3: number;
  onTruckCapacityChanged: (cap: number) => void;
  manualOverrideYd3: number | null;
  onManualOverrideChanged: (val: number | null) => void;
  isBalanced: boolean;
  onToggleBalanced: (balanced: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Screen5Volume: React.FC<Screen5VolumeProps> = ({
  language,
  units,
  scaleConfig,
  depthInches,
  wastePercent,
  onWasteChanged,
  truckCapacityYd3,
  onTruckCapacityChanged,
  manualOverrideYd3,
  onManualOverrideChanged,
  isBalanced,
  onToggleBalanced,
  onNext,
  onBack,
}) => {
  const [showOverrideInput, setShowOverrideInput] = useState(manualOverrideYd3 !== null);
  const [customOverrideStr, setCustomOverrideStr] = useState(
    manualOverrideYd3 ? manualOverrideYd3.toString() : ''
  );

  const areaSqFt = scaleConfig.computedAreaSqFt;
  const areaSqM = scaleConfig.computedAreaSqM;

  const vols = calculateVolumes(
    areaSqFt,
    depthInches,
    wastePercent,
    truckCapacityYd3,
    manualOverrideYd3
  );

  const currentOrderedVol = units === 'imperial' ? vols.finalYd3 : vols.finalM3;
  const currentOrderedUnit = units === 'imperial' ? 'yd³' : 'm³';

  const truckSplitResult = splitTruckloads(vols.finalYd3, truckCapacityYd3, isBalanced);

  // Difference vs computed math
  const diffYd3 = manualOverrideYd3 !== null ? Math.round((manualOverrideYd3 - vols.roundedFinalYd3) * 100) / 100 : 0;
  const diffM3 = Math.round(diffYd3 * 0.764555 * 10) / 10;

  const handleOverrideToggle = (checked: boolean) => {
    setShowOverrideInput(checked);
    if (!checked) {
      onManualOverrideChanged(null);
    } else {
      const initial = vols.roundedFinalYd3;
      setCustomOverrideStr(initial.toString());
      onManualOverrideChanged(initial);
    }
  };

  const handleCustomOverrideChange = (valStr: string) => {
    setCustomOverrideStr(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      if (units === 'imperial') {
        onManualOverrideChanged(num);
      } else {
        onManualOverrideChanged(num / 0.764555);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
        <div className="text-base font-bold text-white flex items-center gap-2">
          <Box className="w-5 h-5 text-amber-400" />
          <span>{t(language, 'screen5Title')}</span>
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          {t(language, 'screen5Subtitle')}
        </div>
      </div>

      {/* 1. Step-By-Step Math Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>{t(language, 'stepByStepMath')}</span>
          <span className="text-amber-400 font-mono font-bold">
            {t(language, 'baseVolumeFormula')}
          </span>
        </div>

        {/* Step formula display */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs sm:text-sm text-slate-200 space-y-1.5">
          {units === 'imperial' ? (
            <>
              <div className="flex justify-between">
                <span className="text-slate-400">1. Slab Area:</span>
                <span className="font-bold text-white">{areaSqFt.toLocaleString()} sq ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">2. Depth:</span>
                <span className="font-bold text-white">
                  {depthInches}" = {(depthInches / 12).toFixed(3)} ft
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5 text-amber-300 font-bold">
                <span>3. Base Volume:</span>
                <span>
                  {(areaSqFt * (depthInches / 12)).toFixed(1)} cu ft ={' '}
                  {vols.baseVolumeYd3.toFixed(2)} yd³
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-slate-400">1. Surface Dalle:</span>
                <span className="font-bold text-white">{areaSqM.toFixed(1)} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">2. Épaisseur:</span>
                <span className="font-bold text-white">
                  {(depthInches * 2.54).toFixed(1)} cm = {((depthInches * 2.54) / 100).toFixed(3)} m
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5 text-amber-300 font-bold">
                <span>3. Volume Net:</span>
                <span>{vols.baseVolumeM3.toFixed(2)} m³</span>
              </div>
            </>
          )}
        </div>

        {/* 2. Waste Allowance Slider (0% - 10%, default 5%) */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-300">
              {t(language, 'wasteAllowance')}
            </label>
            <span className="text-base font-black text-amber-400 font-mono">
              +{wastePercent}% ({units === 'imperial' ? `+${(vols.baseVolumeYd3 * (wastePercent / 100)).toFixed(2)} yd³` : `+${(vols.baseVolumeM3 * (wastePercent / 100)).toFixed(2)} m³`})
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={wastePercent}
            onChange={(e) => onWasteChanged(parseInt(e.target.value) || 0)}
            className="w-full h-3 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>0% (Tight)</span>
            <span className="text-amber-400 font-bold">5% (Recommended)</span>
            <span>10% (Uneven/Rough)</span>
          </div>

          <div className="text-[11px] text-slate-400 mt-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            {t(language, 'wasteSliderHelp')}
          </div>
        </div>
      </div>

      {/* 3. Final Ordered Volume & Manual Override */}
      <div className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
              {t(language, 'roundedVolumeLabel')}
            </div>
            <div className="text-4xl font-black text-white font-mono mt-1">
              {currentOrderedVol.toFixed(2)}{' '}
              <span className="text-xl font-bold text-amber-400">{currentOrderedUnit}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {units === 'imperial'
                ? `Calculated ${vols.calculatedFinalYd3.toFixed(2)} yd³ rounded up to 0.25 yd³`
                : `Calculé ${vols.calculatedFinalM3.toFixed(2)} m³ arrondi à 0.5 m³`}
            </div>
          </div>

          <div className="text-right">
            <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold">
              {truckSplitResult.trucks.length} {truckSplitResult.trucks.length === 1 ? 'Truck' : 'Trucks'}
            </span>
          </div>
        </div>

        {/* Manual Override Checkbox */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOverrideInput}
              onChange={(e) => handleOverrideToggle(e.target.checked)}
              className="w-5 h-5 rounded bg-slate-950 border-slate-700 text-amber-400 focus:ring-amber-400 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-300">
              {t(language, 'manualOverrideCheckbox')}
            </span>
          </label>

          {showOverrideInput && (
            <div className="mt-3 flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  {t(language, 'overrideInputLabel')} ({currentOrderedUnit})
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0.5"
                  value={customOverrideStr}
                  onChange={(e) => handleCustomOverrideChange(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-900 border-2 border-amber-400 rounded-lg text-lg font-bold text-white font-mono"
                />
              </div>

              {diffYd3 !== 0 && (
                <div className="shrink-0 text-right">
                  <div className="text-[10px] text-slate-400">{t(language, 'diffVsComputed')}</div>
                  <div
                    className={`text-sm font-bold font-mono ${
                      diffYd3 > 0 ? 'text-amber-400' : 'text-rose-400'
                    }`}
                  >
                    {diffYd3 > 0 ? `+${diffYd3}` : diffYd3} yd³ (
                    {diffM3 > 0 ? `+${diffM3}` : diffM3} m³)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Truckload Allocation & Short-Load Warning */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {t(language, 'truckAllocation')}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span>{t(language, 'truckCapacity')}:</span>
            <span className="font-bold text-amber-400 font-mono">
              {units === 'imperial' ? `${truckCapacityYd3} yd³` : `${Math.round(truckCapacityYd3 * 0.764555)} m³`}
            </span>
          </div>
        </div>

        {/* Truck Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {truckSplitResult.trucks.map((truck) => {
            const isShort =
              truckSplitResult.isShortLoad &&
              truckSplitResult.shortLoadTruckIndex === truck.truckNumber - 1;

            return (
              <div
                key={truck.truckNumber}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isShort
                    ? 'bg-rose-950/40 border-rose-500/80'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Truck #{truck.truckNumber}</span>
                    {isShort && (
                      <span className="text-[10px] uppercase font-black text-rose-400 bg-rose-900/60 px-1.5 py-0.2 rounded border border-rose-500/60">
                        Short Load
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Ready-Mix Transit Mixer
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-base font-black text-white">
                    {units === 'imperial' ? `${truck.volumeYd3} yd³` : `${truck.volumeM3} m³`}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {units === 'imperial' ? `~${truck.volumeM3} m³` : `~${truck.volumeYd3} yd³`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Short Load Warning Box & Balance Action */}
        {truckSplitResult.isShortLoad && (
          <div className="bg-rose-950/50 border-2 border-rose-500/80 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-rose-300">
                  {t(language, 'shortLoadAlertTitle')}
                </div>
                <div className="text-xs text-rose-100 mt-0.5">
                  {t(language, 'shortLoadAlertDesc')}
                </div>
              </div>
            </div>

            {truckSplitResult.canBalance && !isBalanced && (
              <button
                type="button"
                onClick={() => onToggleBalanced(true)}
                className="w-full py-2.5 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition touch-manipulation cursor-pointer"
              >
                <Scale className="w-4 h-4" />
                <span>{t(language, 'balanceLoadsButton')}</span>
              </button>
            )}
          </div>
        )}

        {isBalanced && (
          <div className="bg-emerald-950/50 border border-emerald-500/60 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{t(language, 'balancedLoadsActive')}</span>
            </div>
            <button
              type="button"
              onClick={() => onToggleBalanced(false)}
              className="text-[11px] underline text-slate-400 hover:text-white"
            >
              Reset to Sequential
            </button>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 min-h-[52px] py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition touch-manipulation cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t(language, 'back')}</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex-[2] min-h-[52px] py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-400/25 transition touch-manipulation cursor-pointer border-2 border-amber-300"
        >
          <span>Choose Delivery & Supplier</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

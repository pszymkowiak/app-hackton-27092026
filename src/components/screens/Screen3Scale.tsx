import React, { useState, useEffect, useRef } from 'react';
import { Ruler, Sparkles, Check, ArrowRight, ArrowLeft, Info, HelpCircle } from 'lucide-react';
import type { Language, UnitSystem, Point, OutlineResult, ScaleConfig, ScaleMode } from '../../types/index.ts';
import { t } from '../../utils/i18n.ts';
import { calculateAreaFromScale } from '../../utils/calc.ts';

interface Screen3ScaleProps {
  language: Language;
  units: UnitSystem;
  photoUrl: string;
  outlineResult: OutlineResult;
  scaleConfig: ScaleConfig;
  onScaleUpdated: (config: ScaleConfig) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Screen3Scale: React.FC<Screen3ScaleProps> = ({
  language,
  units,
  photoUrl,
  outlineResult,
  scaleConfig,
  onScaleUpdated,
  onNext,
  onBack,
}) => {
  const [mode, setMode] = useState<ScaleMode>(scaleConfig.mode || 'mark_known');
  const [pointA, setPointA] = useState<Point | null>(scaleConfig.pointA || { x: 0.25, y: 0.21 });
  const [pointB, setPointB] = useState<Point | null>(scaleConfig.pointB || { x: 0.60, y: 0.19 });
  const [realLength, setRealLength] = useState<number>(scaleConfig.realLength || (units === 'imperial' ? 10 : 3.0));
  const [manualLength, setManualLength] = useState<number>(scaleConfig.manualLength || (units === 'imperial' ? 20 : 6));
  const [manualWidth, setManualWidth] = useState<number>(scaleConfig.manualWidth || (units === 'imperial' ? 14 : 4.2));
  const [source, setSource] = useState<'photo_reference' | 'manual_dimensions' | 'gemini_estimate'>(
    scaleConfig.source || 'photo_reference'
  );
  const [activeTapPoint, setActiveTapPoint] = useState<'A' | 'B'>('A');

  const containerRef = useRef<HTMLDivElement>(null);

  // Recalculate area whenever scale changes
  useEffect(() => {
    let sqFt = 0;
    let sqM = 0;

    if (mode === 'mark_known' && pointA && pointB && realLength > 0) {
      const res = calculateAreaFromScale(
        outlineResult.polygon,
        pointA,
        pointB,
        realLength,
        4 / 3,
        units
      );
      sqFt = Math.round(res.sqFt * 10) / 10;
      sqM = Math.round(res.sqM * 10) / 10;
    } else if (mode === 'manual_dims') {
      if (units === 'imperial') {
        sqFt = Math.round(manualLength * manualWidth * 10) / 10;
        sqM = Math.round(sqFt * 0.092903 * 10) / 10;
      } else {
        sqM = Math.round(manualLength * manualWidth * 10) / 10;
        sqFt = Math.round((sqM / 0.092903) * 10) / 10;
      }
    }

    onScaleUpdated({
      mode,
      pointA,
      pointB,
      realLength,
      manualLength,
      manualWidth,
      computedAreaSqFt: sqFt,
      computedAreaSqM: sqM,
      source,
    });
  }, [mode, pointA, pointB, realLength, manualLength, manualWidth, units, outlineResult.polygon]);

  const handlePhotoClick = (e: React.MouseEvent) => {
    if (mode !== 'mark_known' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));

    if (activeTapPoint === 'A') {
      setPointA({ x, y });
      setActiveTapPoint('B');
    } else {
      setPointB({ x, y });
      setActiveTapPoint('A');
    }
    setSource('photo_reference');
  };

  const handleApplyGeminiEstimate = () => {
    const est = outlineResult.roughEstimate;
    if (!est) return;

    if (units === 'imperial') {
      const len = est.estimatedLengthFt || 20;
      const wid = est.estimatedWidthFt || 14;
      setManualLength(len);
      setManualWidth(wid);
    } else {
      const len = Math.round(((est.estimatedLengthFt || 20) * 0.3048) * 10) / 10;
      const wid = Math.round(((est.estimatedWidthFt || 14) * 0.3048) * 10) / 10;
      setManualLength(len);
      setManualWidth(wid);
    }
    setMode('manual_dims');
    setSource('gemini_estimate');
  };

  const currentArea = units === 'imperial' ? scaleConfig.computedAreaSqFt : scaleConfig.computedAreaSqM;
  const currentAreaUnit = units === 'imperial' ? 'sq ft' : 'm²';

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
        <div className="text-base font-bold text-white flex items-center gap-2">
          <Ruler className="w-5 h-5 text-amber-400" />
          <span>{t(language, 'screen3Title')}</span>
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          {t(language, 'screen3Subtitle')}
        </div>
      </div>

      {/* Mode Selector Tabs (Big Touch Targets) */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => {
            setMode('mark_known');
            setSource('photo_reference');
          }}
          className={`py-3 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 touch-manipulation min-h-[48px] ${
            mode === 'mark_known'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <span>Option A: Mark Known Length</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('manual_dims');
            setSource('manual_dimensions');
          }}
          className={`py-3 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 touch-manipulation min-h-[48px] ${
            mode === 'manual_dims'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <span>Option B: Enter Dimensions</span>
        </button>
      </div>

      {/* OPTION A: Mark Known Length on Photo */}
      {mode === 'mark_known' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span>{t(language, 'markKnownDesc')}</span>
              <div className="mt-1 flex items-center gap-2 font-bold text-amber-400">
                <span>Active Target:</span>
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded text-[11px]">
                  {activeTapPoint === 'A' ? 'Point 1 (Start)' : 'Point 2 (End)'}
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  (Tap photo to relocate)
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Reference Caliper Canvas */}
          <div
            ref={containerRef}
            onClick={handlePhotoClick}
            className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700 shadow-xl select-none touch-none cursor-crosshair"
          >
            <img
              src={photoUrl}
              alt="Slab scale reference"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />

            {/* Polygon outline overlay for context */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {outlineResult.polygon.length >= 3 && (
                <polygon
                  points={outlineResult.polygon
                    .map((p) => `${p.x * 100}%,${p.y * 100}%`)
                    .join(' ')}
                  fill="rgba(250, 204, 21, 0.15)"
                  stroke="#facc15"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              )}

              {/* Reference Caliper Line between Point A and Point B */}
              {pointA && pointB && (
                <g>
                  {/* Outer glow line */}
                  <line
                    x1={`${pointA.x * 100}%`}
                    y1={`${pointA.y * 100}%`}
                    x2={`${pointB.x * 100}%`}
                    y2={`${pointB.y * 100}%`}
                    stroke="#38bdf8"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {/* Caliper ticks */}
                  <circle cx={`${pointA.x * 100}%`} cy={`${pointA.y * 100}%`} r="6" fill="#38bdf8" />
                  <circle cx={`${pointB.x * 100}%`} cy={`${pointB.y * 100}%`} r="6" fill="#38bdf8" />
                </g>
              )}
            </svg>

            {/* Point A Marker */}
            {pointA && (
              <div
                style={{ left: `${pointA.x * 100}%`, top: `${pointA.y * 100}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none"
              >
                <div className="w-8 h-8 rounded-full bg-sky-400 text-slate-950 font-black text-xs flex items-center justify-center ring-4 ring-sky-400/40 shadow-lg">
                  1
                </div>
                <div className="bg-slate-950/90 text-sky-300 text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 border border-sky-400/50">
                  Pt 1
                </div>
              </div>
            )}

            {/* Point B Marker */}
            {pointB && (
              <div
                style={{ left: `${pointB.x * 100}%`, top: `${pointB.y * 100}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none"
              >
                <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center ring-4 ring-amber-400/40 shadow-lg">
                  2
                </div>
                <div className="bg-slate-950/90 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 border border-amber-400/50">
                  Pt 2
                </div>
              </div>
            )}
          </div>

          {/* Real Length Numeric Stepper for Point 1 -> Point 2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              {t(language, 'referenceLengthLabel')} ({units === 'imperial' ? 'feet' : 'meters'})
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRealLength(Math.max(1, Math.round((realLength - (units === 'imperial' ? 1 : 0.5)) * 10) / 10))}
                className="w-14 h-14 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-2xl flex items-center justify-center border border-slate-700 active:scale-95 touch-manipulation cursor-pointer"
              >
                -
              </button>

              <div className="flex-1 relative">
                <input
                  type="number"
                  step={units === 'imperial' ? '1' : '0.1'}
                  min="0.5"
                  value={realLength}
                  onChange={(e) => setRealLength(Math.max(0.1, parseFloat(e.target.value) || 0))}
                  className="w-full h-14 bg-slate-950 border-2 border-slate-700 focus:border-amber-400 rounded-xl text-center text-2xl font-black text-white font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {units === 'imperial' ? 'FT' : 'M'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setRealLength(Math.round((realLength + (units === 'imperial' ? 1 : 0.5)) * 10) / 10)}
                className="w-14 h-14 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-2xl flex items-center justify-center border border-slate-700 active:scale-95 touch-manipulation cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Quick preset buttons */}
            <div className="flex gap-2 mt-3">
              {(units === 'imperial' ? [8, 10, 12, 16, 20] : [2.5, 3.0, 4.0, 5.0, 6.0]).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRealLength(val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                    realLength === val
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {val} {units === 'imperial' ? 'ft' : 'm'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OPTION B: Enter Dimensions Manually */}
      {mode === 'manual_dims' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t(language, 'manualLengthLabel')} ({units === 'imperial' ? 'ft' : 'm'})
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={manualLength}
                onChange={(e) => {
                  setManualLength(parseFloat(e.target.value) || 0);
                  setSource('manual_dimensions');
                }}
                className="w-full h-12 px-3 bg-slate-950 border-2 border-slate-700 focus:border-amber-400 rounded-xl text-lg font-bold text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t(language, 'manualWidthLabel')} ({units === 'imperial' ? 'ft' : 'm'})
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={manualWidth}
                onChange={(e) => {
                  setManualWidth(parseFloat(e.target.value) || 0);
                  setSource('manual_dimensions');
                }}
                className="w-full h-12 px-3 bg-slate-950 border-2 border-slate-700 focus:border-amber-400 rounded-xl text-lg font-bold text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Gemini Rough Estimate Suggestion Banner (Must be confirmed by user) */}
      {outlineResult.roughEstimate && (
        <div className="bg-gradient-to-r from-slate-900 to-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>{t(language, 'geminiSuggestionTitle')}</span>
                <span className="text-[10px] text-amber-300/80 px-1.5 py-0.2 rounded bg-amber-400/10 border border-amber-400/20">
                  {t(language, 'geminiSuggestionNote')}
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-200 mt-0.5">
                ~{outlineResult.roughEstimate.estimatedLengthFt} ft × {outlineResult.roughEstimate.estimatedWidthFt} ft
                {outlineResult.roughEstimate.referenceClues && (
                  <span className="text-xs text-slate-400 block font-normal">
                    ({outlineResult.roughEstimate.referenceClues})
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyGeminiEstimate}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 transition shadow-sm touch-manipulation cursor-pointer"
          >
            {t(language, 'useEstimateButton')}
          </button>
        </div>
      )}

      {/* Computed Area Summary Card */}
      <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
              {t(language, 'computedAreaLabel')}
            </div>
            <div className="text-3xl font-black text-white font-mono mt-0.5">
              {currentArea.toLocaleString()} <span className="text-lg font-bold text-slate-400">{currentAreaUnit}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                {source === 'photo_reference'
                  ? t(language, 'sourcePhotoRef')
                  : source === 'gemini_estimate'
                  ? t(language, 'sourceGemini')
                  : t(language, 'sourceManual')}
              </span>
            </div>
          </div>

          <div className="text-right font-mono text-xs text-slate-400">
            {units === 'imperial' ? (
              <div>~{(scaleConfig.computedAreaSqM).toFixed(1)} m²</div>
            ) : (
              <div>~{(scaleConfig.computedAreaSqFt).toFixed(0)} sq ft</div>
            )}
          </div>
        </div>
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
          disabled={currentArea <= 0}
          onClick={onNext}
          className="flex-[2] min-h-[52px] py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-400/25 transition disabled:opacity-50 touch-manipulation cursor-pointer border-2 border-amber-300"
        >
          <span>Select Depth & Mix</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

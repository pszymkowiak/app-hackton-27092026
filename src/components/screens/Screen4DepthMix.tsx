import React, { useState } from 'react';
import { Layers, Check, ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
import type { Language, UnitSystem, ConcreteMix } from '../../types/index.ts';
import { t } from '../../utils/i18n.ts';

interface Screen4DepthMixProps {
  language: Language;
  units: UnitSystem;
  depthInches: number;
  onDepthChanged: (inches: number) => void;
  mix: ConcreteMix;
  onMixChanged: (mix: ConcreteMix) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Screen4DepthMix: React.FC<Screen4DepthMixProps> = ({
  language,
  units,
  depthInches,
  onDepthChanged,
  mix,
  onMixChanged,
  onNext,
  onBack,
}) => {
  const [isCustomDepth, setIsCustomDepth] = useState(false);
  const [customValue, setCustomValue] = useState(
    units === 'imperial' ? depthInches.toString() : (depthInches * 2.54).toFixed(0)
  );

  // Depth presets: 4, 5, 6, 8 inches (or 10, 12.5, 15, 20 cm)
  const imperialPresets = [
    { label: '4 in', value: 4, usage: 'Sidewalks, patios' },
    { label: '5 in', value: 5, usage: 'Driveways, light trucks' },
    { label: '6 in', value: 6, usage: 'Commercial, heavy loads' },
    { label: '8 in', value: 8, usage: 'Footings, heavy machinery' },
  ];

  const metricPresets = [
    { label: '10 cm', value: 10 / 2.54, usage: 'Trottoirs, terrasses' },
    { label: '12 cm', value: 12 / 2.54, usage: 'Allées véhicules' },
    { label: '15 cm', value: 15 / 2.54, usage: 'Dalles carrossables' },
    { label: '20 cm', value: 20 / 2.54, usage: 'Fondations lourdes' },
  ];

  const depthPresets = units === 'imperial' ? imperialPresets : metricPresets;

  const strengthOptions =
    units === 'imperial'
      ? ['2500 PSI', '3000 PSI', '4000 PSI', '5000 PSI']
      : ['C20/25', 'C25/30', 'C30/37', 'C35/45'];

  const slumpOptions =
    units === 'imperial'
      ? ['3 in (Stiff / Slipform)', '4 in (Standard Flatwork)', '5-6 in (Pump / Flowable)']
      : ['80 mm (Ferme)', '100 mm (Standard)', '140 mm (Pompable)'];

  const aggregateOptions =
    units === 'imperial'
      ? ['3/4 in (Standard)', '1/2 in (Medium)', '3/8 in (Peastone / Small pump)']
      : ['20 mm (Standard)', '14 mm (Moyen)', '10 mm (Gravillon pompe)'];

  const placementOptions = [
    { id: 'chute', label: t(language, 'placementChute'), sub: 'Direct from mixer chute' },
    { id: 'pump', label: t(language, 'placementPump'), sub: 'Line or boom pump needed' },
    { id: 'wheelbarrow', label: t(language, 'placementBuggy'), sub: 'Manual transport to forms' },
  ] as const;

  const handleCustomDepthChange = (valStr: string) => {
    setCustomValue(valStr);
    const num = parseFloat(valStr) || 0;
    if (num > 0) {
      if (units === 'imperial') {
        onDepthChanged(num);
      } else {
        onDepthChanged(num / 2.54);
      }
    }
  };

  const currentDisplayDepth =
    units === 'imperial'
      ? `${depthInches.toFixed(1)} inches`
      : `${(depthInches * 2.54).toFixed(1)} cm`;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
        <div className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          <span>{t(language, 'screen4Title')}</span>
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          {t(language, 'screen4Subtitle')}
        </div>
      </div>

      {/* 1. Depth Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {t(language, 'slabDepth')}
          </label>
          <span className="text-base font-extrabold text-amber-400 font-mono">
            {currentDisplayDepth}
          </span>
        </div>

        {/* Depth Range Slider */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold">Ajustement précis par curseur (Slider) :</span>
            <span className="font-mono font-black text-amber-400">
              {currentDisplayDepth}
            </span>
          </div>
          <input
            type="range"
            min={units === 'imperial' ? "2" : "5"}
            max={units === 'imperial' ? "18" : "45"}
            step={units === 'imperial' ? "0.5" : "1"}
            value={units === 'imperial' ? depthInches : Math.round(depthInches * 2.54)}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (units === 'imperial') {
                onDepthChanged(val);
              } else {
                onDepthChanged(val / 2.54);
              }
            }}
            className="w-full accent-amber-400 h-3 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>{units === 'imperial' ? '2 in' : '5 cm'}</span>
            <span>{units === 'imperial' ? '6 in' : '15 cm'}</span>
            <span>{units === 'imperial' ? '18 in' : '45 cm'}</span>
          </div>
        </div>

        {/* Depth Preset Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {depthPresets.map((preset) => {
            const isSelected = !isCustomDepth && Math.abs(depthInches - preset.value) < 0.1;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setIsCustomDepth(false);
                  onDepthChanged(preset.value);
                }}
                className={`p-3 rounded-xl border text-center transition touch-manipulation min-h-[58px] ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md shadow-amber-400/20'
                    : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="text-lg font-black">{preset.label}</div>
                <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                  {preset.usage}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Depth Toggle & Input */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsCustomDepth(!isCustomDepth)}
            className="text-xs text-slate-400 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{isCustomDepth ? '← Use standard presets' : '+ Enter custom depth'}</span>
          </button>

          {isCustomDepth && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                min="1"
                value={customValue}
                onChange={(e) => handleCustomDepthChange(e.target.value)}
                className="w-32 h-12 px-3 bg-slate-950 border-2 border-amber-400 rounded-xl text-lg font-bold text-white font-mono text-center"
              />
              <span className="text-sm font-bold text-slate-300">
                {units === 'imperial' ? 'inches' : 'cm'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Concrete Type Specification Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {t(language, 'concreteTypeHeading')}
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
              Contractor Selected
            </span>
          </div>
          {/* Structural spec disclaimer note */}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-300/90 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{t(language, 'concreteNote')}</span>
          </div>
        </div>

        {/* Strength Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            {t(language, 'strength')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {strengthOptions.map((str) => (
              <button
                key={str}
                type="button"
                onClick={() => onMixChanged({ ...mix, strength: str })}
                className={`py-3 px-2 rounded-xl text-xs font-bold border transition touch-manipulation min-h-[48px] ${
                  mix.strength === str
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {str}
              </button>
            ))}
          </div>
        </div>

        {/* Slump Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            {t(language, 'slump')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {slumpOptions.map((slump) => (
              <button
                key={slump}
                type="button"
                onClick={() => onMixChanged({ ...mix, slump })}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border text-left transition touch-manipulation min-h-[44px] ${
                  mix.slump === slump
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {slump}
              </button>
            ))}
          </div>
        </div>

        {/* Max Aggregate Size */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            {t(language, 'maxAggregate')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {aggregateOptions.map((agg) => (
              <button
                key={agg}
                type="button"
                onClick={() => onMixChanged({ ...mix, maxAggregate: agg })}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border text-left transition touch-manipulation min-h-[44px] ${
                  mix.maxAggregate === agg
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {agg}
              </button>
            ))}
          </div>
        </div>

        {/* Additives: Air-entrained & Fibers Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Air-entrained */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Air-Entrained Mix</div>
              <div className="text-[11px] text-slate-400">Exterior freeze-thaw durability</div>
            </div>
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => onMixChanged({ ...mix, airEntrained: true })}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  mix.airEntrained ? 'bg-amber-400 text-slate-950' : 'text-slate-400'
                }`}
              >
                {t(language, 'yes')}
              </button>
              <button
                type="button"
                onClick={() => onMixChanged({ ...mix, airEntrained: false })}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  !mix.airEntrained ? 'bg-amber-400 text-slate-950' : 'text-slate-400'
                }`}
              >
                {t(language, 'no')}
              </button>
            </div>
          </div>

          {/* Fibers */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Micro-Fiber Reinforcement</div>
              <div className="text-[11px] text-slate-400">Plastic shrinkage crack control</div>
            </div>
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => onMixChanged({ ...mix, fibers: true })}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  mix.fibers ? 'bg-amber-400 text-slate-950' : 'text-slate-400'
                }`}
              >
                {t(language, 'yes')}
              </button>
              <button
                type="button"
                onClick={() => onMixChanged({ ...mix, fibers: false })}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  !mix.fibers ? 'bg-amber-400 text-slate-950' : 'text-slate-400'
                }`}
              >
                {t(language, 'no')}
              </button>
            </div>
          </div>
        </div>

        {/* Placement Method */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            {t(language, 'placementMethod')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {placementOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onMixChanged({ ...mix, placement: opt.id })}
                className={`p-3 rounded-xl border text-left transition touch-manipulation min-h-[58px] ${
                  mix.placement === opt.id
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-bold">{opt.label}</div>
                <div className={`text-[10px] mt-0.5 ${mix.placement === opt.id ? 'text-slate-900' : 'text-slate-400'}`}>
                  {opt.sub}
                </div>
              </button>
            ))}
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
          onClick={onNext}
          className="flex-[2] min-h-[52px] py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-400/25 transition touch-manipulation cursor-pointer border-2 border-amber-300"
        >
          <span>Calculate Volume & Trucks</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

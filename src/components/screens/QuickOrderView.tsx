import React, { useState, useEffect } from 'react';
import {
  Layers,
  Box,
  Truck,
  ArrowRight,
  Sparkles,
  Ruler,
  AlertTriangle,
  Scale,
  Camera,
  Check,
  Plus,
  Minus,
  Sliders,
  DollarSign,
  ShieldCheck,
  Building,
  Users,
  Leaf,
  Calendar,
} from 'lucide-react';
import type {
  Language,
  UnitSystem,
  ConcreteMix,
  CountryConfig,
  Supplier,
} from '../../types/index.ts';
import { t } from '../../utils/i18n.ts';
import { splitTruckloads } from '../../utils/calc.ts';
import { WORLDWIDE_SUPPLIERS } from '../../data/countries.ts';
import { getPoolTier } from '../../utils/pool.ts';

interface QuickOrderViewProps {
  language: Language;
  units: UnitSystem;
  country: CountryConfig;
  supplier?: Supplier;
  depthInches: number;
  onDepthChanged: (depthInches: number) => void;
  deliveryFlexDays: number;
  onDeliveryFlexDaysChanged: (days: number) => void;
  mix: ConcreteMix;
  onMixChanged: (mix: ConcreteMix) => void;
  wastePercent: number;
  onWasteChanged: (waste: number) => void;
  onVolumeCalculated: (params: {
    areaSqFt: number;
    areaSqM: number;
    depthInches: number;
    baseVolumeYd3: number;
    baseVolumeM3: number;
    finalVolumeYd3: number;
    finalVolumeM3: number;
  }) => void;
  onProceedToDelivery: () => void;
  onSwitchToPhotoMeasure: () => void;
}

export const QuickOrderView: React.FC<QuickOrderViewProps> = ({
  language,
  units,
  country,
  supplier,
  depthInches,
  onDepthChanged,
  deliveryFlexDays,
  onDeliveryFlexDaysChanged,
  mix,
  onMixChanged,
  wastePercent,
  onWasteChanged,
  onVolumeCalculated,
  onProceedToDelivery,
  onSwitchToPhotoMeasure,
}) => {
  const isMetric = units === 'metric';
  const isFrench = language === 'fr';

  // Project type preset
  const [projectType, setProjectType] = useState<'slab' | 'footing' | 'driveway' | 'floor' | 'direct'>('slab');

  // Dimension States
  const [length, setLength] = useState<number>(isMetric ? 7.0 : 23.0);
  const [width, setWidth] = useState<number>(isMetric ? 4.5 : 15.0);
  const [depthCm, setDepthCm] = useState<number>(12); // cm for metric
  const [directVolume, setDirectVolume] = useState<number>(isMetric ? 6.0 : 8.0);

  // Fallback supplier for price estimate if not passed
  const activeSupplier =
    supplier ||
    WORLDWIDE_SUPPLIERS.find((s) => s.country === country.code) ||
    WORLDWIDE_SUPPLIERS[0];

  // Sync depth when units or preset change
  useEffect(() => {
    if (isMetric) {
      onDepthChanged(depthCm / 2.54);
    } else {
      setDepthCm(Math.round(depthInches * 2.54));
    }
  }, [units]);

  // Project Preset Selector
  const handleSelectPreset = (type: 'slab' | 'footing' | 'driveway' | 'floor' | 'direct') => {
    setProjectType(type);
    if (type === 'slab') {
      if (isMetric) {
        setLength(7.0);
        setWidth(4.5);
        setDepthCm(12);
        onDepthChanged(12 / 2.54);
      } else {
        setLength(23.0);
        setWidth(15.0);
        onDepthChanged(4.7);
      }
    } else if (type === 'footing') {
      if (isMetric) {
        setLength(18.0);
        setWidth(0.5);
        setDepthCm(35);
        onDepthChanged(35 / 2.54);
      } else {
        setLength(60.0);
        setWidth(1.6);
        onDepthChanged(14);
      }
    } else if (type === 'driveway') {
      if (isMetric) {
        setLength(14.0);
        setWidth(3.5);
        setDepthCm(15);
        onDepthChanged(15 / 2.54);
      } else {
        setLength(45.0);
        setWidth(12.0);
        onDepthChanged(6);
      }
    } else if (type === 'floor') {
      if (isMetric) {
        setLength(10.0);
        setWidth(8.0);
        setDepthCm(10);
        onDepthChanged(10 / 2.54);
      } else {
        setLength(32.0);
        setWidth(26.0);
        onDepthChanged(4);
      }
    }
  };

  // Calculations
  let areaSqFt = 0;
  let areaSqM = 0;
  let baseVolumeYd3 = 0;
  let baseVolumeM3 = 0;

  if (projectType === 'direct') {
    if (isMetric) {
      baseVolumeM3 = directVolume;
      baseVolumeYd3 = directVolume / 0.764555;
    } else {
      baseVolumeYd3 = directVolume;
      baseVolumeM3 = directVolume * 0.764555;
    }
    areaSqM = baseVolumeM3 / (depthCm / 100);
    areaSqFt = areaSqM * 10.7639;
  } else {
    if (isMetric) {
      areaSqM = length * width;
      areaSqFt = areaSqM * 10.7639;
      const dMeters = depthCm / 100;
      baseVolumeM3 = areaSqM * dMeters;
      baseVolumeYd3 = baseVolumeM3 / 0.764555;
    } else {
      areaSqFt = length * width;
      areaSqM = areaSqFt / 10.7639;
      const dFeet = depthInches / 12;
      baseVolumeYd3 = (areaSqFt * dFeet) / 27;
      baseVolumeM3 = baseVolumeYd3 * 0.764555;
    }
  }

  // With waste
  const finalVolumeYd3Raw = baseVolumeYd3 * (1 + wastePercent / 100);
  const finalVolumeM3Raw = baseVolumeM3 * (1 + wastePercent / 100);

  // Industry standard roundings
  const finalVolumeYd3 = Math.max(0.5, Math.ceil(finalVolumeYd3Raw * 4) / 4); // round up to 0.25 yd3
  const finalVolumeM3 = Math.max(0.5, Math.ceil(finalVolumeM3Raw * 2) / 2); // round up to 0.5 m3

  // Truckload splitting
  const truckCapacity = isMetric ? activeSupplier.truckCapacityM3 : activeSupplier.truckCapacityYd3;
  const targetVolume = isMetric ? finalVolumeM3 : finalVolumeYd3;
  const truckSplits = splitTruckloads(targetVolume, truckCapacity, false);

  // Pourwise Share Tier & Discount calculation
  const poolTier = getPoolTier(deliveryFlexDays);
  const priceUnit = isMetric ? activeSupplier.pricePerM3 : activeSupplier.pricePerYd3;
  const rawConcreteCost = targetVolume * priceUnit;
  const poolDiscountAmount = Math.round((rawConcreteCost * (poolTier.discountPercent / 100)) * 100) / 100;
  const finalEstimatedCost = Math.round(rawConcreteCost - poolDiscountAmount);

  // Notify parent component on calculation
  useEffect(() => {
    onVolumeCalculated({
      areaSqFt: Math.round(areaSqFt * 10) / 10,
      areaSqM: Math.round(areaSqM * 10) / 10,
      depthInches: isMetric ? depthCm / 2.54 : depthInches,
      baseVolumeYd3: Math.round(baseVolumeYd3 * 100) / 100,
      baseVolumeM3: Math.round(baseVolumeM3 * 100) / 100,
      finalVolumeYd3,
      finalVolumeM3,
    });
  }, [length, width, depthCm, depthInches, directVolume, wastePercent, projectType, isMetric, deliveryFlexDays]);

  return (
    <div className="space-y-4">
      {/* Platform Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-black tracking-wider text-amber-400">
              {country.flag} {country.name} · Pourwise Platform
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <Users className="w-3 h-3" />
              {isFrench ? 'Béton Groupé Actif' : 'Pourwise Share Active'}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white mt-1">
            {isFrench ? 'Calculateur & Commande de Béton Prêt à l’Emploi' : 'Ready-Mix Concrete Estimator & Dispatch'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isFrench
              ? 'Tarifs directs centrale, cubage certifié et livraisons partagées type Uber Pool'
              : 'Direct batch plant pricing, verified volumes and shared pool deliveries'}
          </p>
        </div>

        <button
          type="button"
          onClick={onSwitchToPhotoMeasure}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 border border-slate-700 hover:border-amber-400/50 transition cursor-pointer shadow-sm"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>{isFrench ? 'Scanner photo IA' : 'AI Photo Scan'}</span>
        </button>
      </div>

      {/* 1. PROJECT PRESET SELECTOR */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>{isFrench ? "Type d'Ouvrage en Béton" : 'Structure Type'}</span>
          <span className="text-[11px] text-amber-400 font-mono">
            {isFrench ? '1 clic = réglages auto' : '1 tap = auto presets'}
          </span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'slab', label: isFrench ? 'Dalle Terrasse' : 'Slab / Patio', icon: '🏡', sub: isMetric ? '12 cm' : '4.7 in' },
            { id: 'footing', label: isFrench ? 'Fondations' : 'Footings', icon: '🏗️', sub: isMetric ? '35 cm' : '14 in' },
            { id: 'driveway', label: isFrench ? 'Allée / Garage' : 'Driveway', icon: '🚗', sub: isMetric ? '15 cm' : '6 in' },
            { id: 'floor', label: isFrench ? 'Plancher Int.' : 'Interior Floor', icon: '🏢', sub: isMetric ? '10 cm' : '4 in' },
            { id: 'direct', label: isFrench ? 'Volume Direct' : 'Direct Volume', icon: '🧮', sub: isMetric ? 'en m³' : 'in yd³' },
          ].map((preset) => {
            const isSelected = projectType === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id as any)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-400/10 border-amber-400 shadow-md shadow-amber-400/10'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{preset.icon}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm" />
                  )}
                </div>
                <div className="mt-2">
                  <div className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {preset.label}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{preset.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DIMENSION INPUTS WITH THICKNESS SLIDER */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Ruler className="w-4 h-4 text-amber-400" />
            <span>{isFrench ? 'Dimensions du Coffrage' : 'Formwork Dimensions'}</span>
          </label>
          <span className="text-xs font-mono font-bold text-slate-400">
            {isFrench ? 'Unités :' : 'Units:'} <span className="text-amber-400">{isMetric ? 'Mètres (m)' : 'Feet (ft)'}</span>
          </span>
        </div>

        {projectType === 'direct' ? (
          /* Direct Volume Input */
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                {isFrench ? 'Volume de béton souhaité :' : 'Target Concrete Volume:'}
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {directVolume.toFixed(2)} {isMetric ? 'm³' : 'yd³'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDirectVolume((v) => Math.max(0.5, Math.round((v - 0.5) * 10) / 10))}
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-lg cursor-pointer transition active:scale-95"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="range"
                min="0.5"
                max="50"
                step="0.5"
                value={directVolume}
                onChange={(e) => setDirectVolume(parseFloat(e.target.value))}
                className="flex-1 accent-amber-400 h-2.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setDirectVolume((v) => Math.min(100, Math.round((v + 0.5) * 10) / 10))}
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-lg cursor-pointer transition active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Length, Width, Depth Steppers & Sliders */
          <div className="space-y-3.5">
            {/* Length */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="text-xs font-bold text-slate-300 w-24">
                  {isFrench ? 'Longueur :' : 'Length:'}
                </span>
                <span className="text-base font-black text-white font-mono">
                  {length.toFixed(1)} {isMetric ? 'm' : 'ft'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
                <button
                  type="button"
                  onClick={() => setLength((l) => Math.max(0.5, Math.round((l - 0.5) * 10) / 10))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="1"
                  max={isMetric ? "30" : "100"}
                  step="0.5"
                  value={length}
                  onChange={(e) => setLength(parseFloat(e.target.value))}
                  className="flex-1 accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setLength((l) => Math.min(100, Math.round((l + 0.5) * 10) / 10))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Width */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="text-xs font-bold text-slate-300 w-24">
                  {isFrench ? 'Largeur :' : 'Width:'}
                </span>
                <span className="text-base font-black text-white font-mono">
                  {width.toFixed(1)} {isMetric ? 'm' : 'ft'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
                <button
                  type="button"
                  onClick={() => setWidth((w) => Math.max(0.2, Math.round((w - 0.5) * 10) / 10))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="0.5"
                  max={isMetric ? "25" : "80"}
                  step="0.5"
                  value={width}
                  onChange={(e) => setWidth(parseFloat(e.target.value))}
                  className="flex-1 accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setWidth((w) => Math.min(50, Math.round((w + 0.5) * 10) / 10))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Thickness / Depth with Dedicated Interactive Range Slider */}
            <div className="p-3.5 rounded-xl bg-slate-900 border-2 border-amber-400/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
                    {isFrench ? 'Épaisseur de la Dalle (Slider) :' : 'Thickness / Slab Depth (Slider):'}
                  </span>
                </div>
                <span className="text-lg font-black text-amber-400 font-mono">
                  {isMetric ? `${depthCm} cm` : `${depthInches.toFixed(1)} in`}
                </span>
              </div>

              {/* Range Slider for Depth */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (isMetric) {
                      const next = Math.max(5, depthCm - 1);
                      setDepthCm(next);
                      onDepthChanged(next / 2.54);
                    } else {
                      const next = Math.max(2, depthInches - 0.5);
                      onDepthChanged(next);
                    }
                  }}
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold cursor-pointer transition active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="flex-1 space-y-1">
                  <input
                    type="range"
                    min={isMetric ? "5" : "2"}
                    max={isMetric ? "40" : "16"}
                    step={isMetric ? "1" : "0.5"}
                    value={isMetric ? depthCm : depthInches}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (isMetric) {
                        setDepthCm(val);
                        onDepthChanged(val / 2.54);
                      } else {
                        onDepthChanged(val);
                      }
                    }}
                    className="w-full accent-amber-400 h-3 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{isMetric ? '5 cm (Fin)' : '2 in (Thin)'}</span>
                    <span>{isMetric ? '15 cm (Carrossable)' : '6 in (Driveway)'}</span>
                    <span>{isMetric ? '40 cm (Gros Œuvre)' : '16 in (Heavy)'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isMetric) {
                      const next = Math.min(50, depthCm + 1);
                      setDepthCm(next);
                      onDepthChanged(next / 2.54);
                    } else {
                      const next = Math.min(20, depthInches + 0.5);
                      onDepthChanged(next);
                    }
                  }}
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold cursor-pointer transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick preset chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {(isMetric ? [8, 10, 12, 15, 20, 25] : [3, 4, 5, 6, 8, 10]).map((presetVal) => {
                  const isCurrent = isMetric ? depthCm === presetVal : Math.round(depthInches) === presetVal;
                  return (
                    <button
                      key={presetVal}
                      type="button"
                      onClick={() => {
                        if (isMetric) {
                          setDepthCm(presetVal);
                          onDepthChanged(presetVal / 2.54);
                        } else {
                          onDepthChanged(presetVal);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {presetVal} {isMetric ? 'cm' : 'in'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Waste Allowance Slider */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              {isFrench ? 'Marge de perte / sécurité :' : 'Waste Allowance:'}
            </span>
            <span className="text-xs font-mono font-black text-amber-400">
              +{wastePercent}% ({isMetric ? `+${((finalVolumeM3Raw - baseVolumeM3)).toFixed(2)} m³` : `+${((finalVolumeYd3Raw - baseVolumeYd3)).toFixed(2)} yd³`})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={wastePercent}
              onChange={(e) => onWasteChanged(parseInt(e.target.value, 10))}
              className="flex-1 accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-xs text-slate-400 w-10 text-right font-mono font-bold">{wastePercent}%</span>
          </div>
        </div>
      </div>

      {/* 3. POURWISE SHARE — UBER POOL FOR CONCRETE (DELIVERY FLEXIBILITY 1 TO 90 DAYS) */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-[#0F172A] border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
        <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                🌱 POURWISE SHARE
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {isFrench ? 'Béton Groupé Économique' : 'Shared Pool Pour'}
              </span>
            </div>
            <h3 className="text-base font-black text-white mt-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>{isFrench ? 'Délai de Livraison Flexible (1 à 90 jours)' : 'Flexible Delivery Window (1 to 90 Days)'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-lg">
              {isFrench
                ? 'Comme Uber Pool : groupez votre coulage avec des chantiers voisins dans la même zone pour réduire les frais de transport et éliminer les surcharges.'
                : 'Like Uber Pool for concrete: group your pour with nearby jobsites to slash transport costs, eliminate short-load fees, and save up to 30%.'}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-slate-400 block">{isFrench ? 'Remise Groupage' : 'Pool Discount'}</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              -{poolTier.discountPercent}%
            </span>
          </div>
        </div>

        {/* 1 to 90 Days Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isFrench ? 'Flexibilité acceptée :' : 'Accepted flexibility:'}</span>
            </span>
            <span className="font-black text-base font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
              {deliveryFlexDays === 1
                ? (isFrench ? '1 jour (Date Fixe)' : '1 Day (Exact Date)')
                : (isFrench ? `Sous ${deliveryFlexDays} jours max` : `Within ${deliveryFlexDays} Days`)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onDeliveryFlexDaysChanged(Math.max(1, deliveryFlexDays - 5))}
              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold cursor-pointer transition active:scale-95"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="flex-1 space-y-1">
              <input
                type="range"
                min="1"
                max="90"
                step="1"
                value={deliveryFlexDays}
                onChange={(e) => onDeliveryFlexDaysChanged(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-400 h-3 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1j (Express)</span>
                <span>7j (-8%)</span>
                <span>21j (-15%)</span>
                <span>45j (-22%)</span>
                <span className="text-emerald-400 font-bold">90j (-30% Max)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDeliveryFlexDaysChanged(Math.min(90, deliveryFlexDays + 5))}
              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold cursor-pointer transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tier status indicator card */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div>
            <div className="font-black text-white flex items-center gap-1.5">
              <span>{isFrench ? poolTier.nameFr : poolTier.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {isFrench ? poolTier.badgeFr : poolTier.badge}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isFrench ? poolTier.descriptionFr : poolTier.description}
            </div>
          </div>

          <div className="sm:text-right shrink-0">
            {poolTier.discountPercent > 0 ? (
              <div>
                <span className="text-[10px] text-slate-400 block">{isFrench ? 'Économie immédiate :' : 'Immediate savings:'}</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  -{country.currencySymbol}{poolDiscountAmount.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 italic">
                {isFrench ? 'Augmentez le délai pour économiser' : 'Slide right to unlock pool savings'}
              </span>
            )}
          </div>
        </div>

        {/* Neighboring match notification */}
        <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>
            {isFrench
              ? `🟢 Centrale ${activeSupplier.name.split(' ')[0]} : ${poolTier.matchedSitesEstimate > 0 ? `${poolTier.matchedSitesEstimate} chantiers en attente de groupage à proximité (< 8 km)` : 'Date exacte réservée sans groupage'}`
              : `🟢 Plant ${activeSupplier.name.split(' ')[0]}: ${poolTier.matchedSitesEstimate > 0 ? `${poolTier.matchedSitesEstimate} active neighborhood pours ready to share transit (< 5 miles)` : 'Direct slot reserved without pool'}`}
          </span>
        </div>
      </div>

      {/* 4. LIVE VOLUME & PRICE RECAP */}
      <div className="bg-gradient-to-b from-slate-900 to-[#0F172A] border-2 border-amber-400/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              {isFrench ? 'Volume Total avec Marge' : 'Total Order Volume'}
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight tabular-nums mt-0.5">
              {isMetric ? `${finalVolumeM3.toFixed(2)} m³` : `${finalVolumeYd3.toFixed(2)} yd³`}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">
              {poolTier.discountPercent > 0 ? (
                <span className="line-through text-slate-400 font-mono mr-1">
                  {country.currencySymbol}{Math.round(rawConcreteCost)}
                </span>
              ) : null}
              {isFrench ? 'Coût Béton Estimé' : 'Estimated Concrete Cost'}
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
              {country.currencySymbol}{finalEstimatedCost}
            </div>
            <div className="text-[10px] text-slate-400">
              {country.currencySymbol}{priceUnit} / {isMetric ? 'm³' : 'yd³'}
              {poolTier.discountPercent > 0 && (
                <span className="text-emerald-400 font-bold ml-1">
                  (-{poolTier.discountPercent}% Share)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400 text-[11px]">{isFrench ? 'Surface :' : 'Surface:'}</span>
            <div className="font-bold text-white font-mono mt-0.5">
              {isMetric ? `${areaSqM.toFixed(1)} m²` : `${areaSqFt.toFixed(0)} sq ft`}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400 text-[11px]">{isFrench ? 'Épaisseur :' : 'Thickness:'}</span>
            <div className="font-bold text-amber-400 font-mono mt-0.5">
              {isMetric ? `${depthCm} cm` : `${depthInches.toFixed(1)} in`}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400 text-[11px]">{isFrench ? 'Toupies requises :' : 'Mixer Trucks:'}</span>
            <div className="font-bold text-amber-400 font-mono mt-0.5">
              {truckSplits.trucks.length} {truckSplits.trucks.length > 1 ? (isFrench ? 'toupies' : 'trucks') : (isFrench ? 'toupie' : 'truck')}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400 text-[11px]">{isFrench ? 'Délai groupé :' : 'Pool Window:'}</span>
            <div className="font-bold text-emerald-400 truncate mt-0.5">
              {deliveryFlexDays === 1 ? 'Date Fixe' : `${deliveryFlexDays}j (-${poolTier.discountPercent}%)`}
            </div>
          </div>
        </div>

        {/* Truckload Split Badges */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            {isFrench ? 'Répartition des Toupies :' : 'Truckload Distribution:'} ({truckCapacity} {isMetric ? 'm³' : 'yd³'} max/camion) :
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {truckSplits.trucks.map((trk, idx) => {
              const vol = isMetric ? trk.volumeM3 : trk.volumeYd3;
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-400/10 text-amber-400 font-mono font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white">Toupie {idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black font-mono text-amber-400">
                      {vol.toFixed(2)} {isMetric ? 'm³' : 'yd³'}
                    </span>
                    {vol < truckCapacity * 0.5 && idx === truckSplits.trucks.length - 1 && (
                      <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1 rounded font-bold" title="Sous-charge possible">
                        {isFrench ? 'Sous-charge' : 'Short-load'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. CONCRETE SPECIFICATION (STRENGTH & PLACEMENT) */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-lg">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            {isFrench ? 'Formulation & Mode de Coulage' : 'Mix Design & Placement'}
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Norme {country.name}</span>
        </label>

        {/* Strength presets */}
        <div>
          <span className="block text-xs font-semibold text-slate-400 mb-1.5">
            {isFrench ? 'Classe de Résistance :' : 'Strength Class:'} ({country.defaultStrength} standard)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {country.availableStrengths.map((str) => {
              const isSelected = mix.strength === str;
              return (
                <button
                  key={str}
                  type="button"
                  onClick={() => onMixChanged({ ...mix, strength: str })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md border-amber-400'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {str}
                </button>
              );
            })}
          </div>
        </div>

        {/* Placement method */}
        <div>
          <span className="block text-xs font-semibold text-slate-400 mb-1.5">
            {isFrench ? 'Mode de Coulage sur Chantier :' : 'Placement Method on Site:'}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'chute', label: isFrench ? 'Goulotte Directe' : 'Direct Chute', sub: '< 3m access', icon: '🛢️' },
              { id: 'pump', label: isFrench ? 'Pompe à Béton' : 'Concrete Pump', sub: 'Long / elevated', icon: '🏗️' },
              { id: 'wheelbarrow', label: isFrench ? 'Brouette / Buggy' : 'Buggy / Wheelbarrow', sub: 'Manual pour', icon: '🚜' },
            ].map((p) => {
              const isSelected = mix.placement === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onMixChanged({ ...mix, placement: p.id as any })}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400/10 border-amber-400 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-base">{p.icon}</div>
                  <div className={`text-xs font-black mt-1 ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}>
                    {p.label}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{p.sub}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. BIG CALL TO ACTION: CHOOSE SUPPLIER & BOOK */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onProceedToDelivery}
          className="w-full min-h-[58px] py-4 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl shadow-amber-400/25 transition cursor-pointer border-2 border-amber-300"
        >
          <span>{isFrench ? 'Choisir la Centrale & Réserver la Toupie' : 'Select Batch Plant & Book Pour'}</span>
          <ArrowRight className="w-5 h-5 stroke-[3]" />
        </button>
        <div className="text-center text-[11px] text-slate-400 mt-2">
          {poolTier.discountPercent > 0
            ? (isFrench ? `✅ Remise Pourwise Share de -${poolTier.discountPercent}% appliquée sur le devis.` : `✅ Pourwise Share discount of -${poolTier.discountPercent}% applied.`)
            : (isFrench ? 'Aucun débit immédiat · Devis ferme garanti avec créneau prioritaire.' : 'Zero upfront charge · Guaranteed firm quotation.')}
        </div>
      </div>
    </div>
  );
};

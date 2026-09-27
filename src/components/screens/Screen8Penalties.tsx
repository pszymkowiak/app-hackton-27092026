import React from 'react';
import { AlertOctagon, Clock, DollarSign, RotateCcw, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import type { Language, Supplier } from '../../types/index.ts';
import { t } from '../../utils/i18n.ts';

interface Screen8PenaltiesProps {
  language: Language;
  supplier: Supplier;
  understood: boolean;
  onUnderstoodChanged: (val: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Screen8Penalties: React.FC<Screen8PenaltiesProps> = ({
  language,
  supplier,
  understood,
  onUnderstoodChanged,
  onNext,
  onBack,
}) => {
  const sym = supplier.currencySymbol || '€';
  const exampleOvertimeMins = 20;
  const exampleOvertimeCost = (exampleOvertimeMins * supplier.waitingFeePerMin).toFixed(2);

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="text-base font-black text-white flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-amber-400" />
          <span>{t(language, 'screen8Title')}</span>
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          {supplier.name} · {t(language, 'screen8Subtitle')}
        </div>
      </div>

      {/* Supplier Terms Breakdown Cards */}
      <div className="space-y-3">
        {/* 1. Returned Concrete */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-950/70 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">
                {t(language, 'returnedConcreteTitle')}
              </span>
              <span className="text-sm font-black text-rose-400 font-mono">
                {sym}{supplier.returnedConcreteFee}/m³ + béton
              </span>
            </div>
            <div className="text-xs text-slate-300 mt-1 leading-relaxed">
              {t(language, 'returnedConcreteDesc')}
            </div>
          </div>
        </div>

        {/* 2. Standby Waiting Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-950/70 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">
                {t(language, 'waitingFeeTitle')}
              </span>
              <span className="text-sm font-black text-amber-400 font-mono">
                {sym}{supplier.waitingFeePerMin.toFixed(2)} / min
              </span>
            </div>
            <div className="text-xs text-slate-300 mt-1 leading-relaxed">
              Les premiers <strong className="text-emerald-400">{supplier.freeUnloadMinutes} minutes</strong> de déchargement sont gratuites par toupie. Au-delà, le temps d'attente s'accumule en direct.
            </div>
          </div>
        </div>

        {/* 3. 90-Minute Concrete Window */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-950/70 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/40">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">
                {t(language, 'concreteWindowFeeTitle')}
              </span>
              <span className="text-xs font-mono font-bold text-sky-400">
                Norme NF EN 206 / ASTM C94
              </span>
            </div>
            <div className="text-xs text-slate-300 mt-1 leading-relaxed">
              {t(language, 'concreteWindowFeeDesc')}
            </div>
          </div>
        </div>

        {/* 4. Short Load Surcharge */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-950/70 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/40">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">
                {t(language, 'shortLoadFeeTitle')}
              </span>
              <span className="text-sm font-black text-orange-400 font-mono">
                {sym}{supplier.shortLoadFee}
              </span>
            </div>
            <div className="text-xs text-slate-300 mt-1 leading-relaxed">
              Appliqué si une toupie est commandée sous le seuil minimum (moins de 4 m³). L'équilibrage des toupies évite cette surtaxe.
            </div>
          </div>
        </div>
      </div>

      {/* Practical Dynamic Example Card */}
      <div className="bg-amber-950/30 border-2 border-amber-400 rounded-2xl p-4 shadow-md">
        <div className="text-xs font-black uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          <span>{t(language, 'dynamicExampleLabel')}</span>
        </div>
        <div className="text-sm font-semibold text-slate-100 leading-snug">
          "{t(language, 'dynamicExampleText')}{' '}
          <strong className="text-amber-400 font-mono font-black text-base underline decoration-amber-400 underline-offset-2">
            {sym}{exampleOvertimeCost}
          </strong>
          ."
        </div>
      </div>

      {/* Mandatory Checkbox: "I understand" */}
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-4">
        <label className="flex items-center gap-3.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => onUnderstoodChanged(e.target.checked)}
            className="w-6 h-6 rounded-lg bg-slate-950 border-2 border-amber-400 text-amber-400 focus:ring-amber-400 cursor-pointer"
          />
          <span className="text-sm font-black text-white">
            {t(language, 'understandCheckbox')}
          </span>
        </label>
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
          disabled={!understood}
          onClick={onNext}
          className="flex-[2] min-h-[52px] py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-400/25 transition disabled:opacity-50 touch-manipulation cursor-pointer border-2 border-amber-300"
        >
          <span>Récapitulatif & Acompte</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

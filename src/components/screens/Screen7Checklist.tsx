import React from 'react';
import { ClipboardCheck, AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import type { Language, SiteChecklist } from '../../types/index.ts';
import { t } from '../../utils/i18n.ts';

interface Screen7ChecklistProps {
  language: Language;
  isPumpPlacement: boolean;
  checklist: SiteChecklist;
  onChecklistChanged: (updated: SiteChecklist) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Screen7Checklist: React.FC<Screen7ChecklistProps> = ({
  language,
  isPumpPlacement,
  checklist,
  onChecklistChanged,
  onNext,
  onBack,
}) => {
  const toggleItem = (key: keyof SiteChecklist) => {
    onChecklistChanged({
      ...checklist,
      [key]: !checklist[key],
    });
  };

  const hasUnchecked =
    !checklist.formsSetAndBraced ||
    !checklist.rebarMeshInPlace ||
    !checklist.subgradeCompacted ||
    !checklist.inspectionPassed ||
    !checklist.crewOnSite ||
    (isPumpPlacement && !checklist.pumpBooked) ||
    !checklist.truckAccessOk;

  const allChecked = !hasUnchecked;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
        <div className="text-base font-bold text-white flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-amber-400" />
          <span>{t(language, 'screen7Title')}</span>
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          {t(language, 'screen7Subtitle')}
        </div>
      </div>

      {/* Checklist items (Glove-friendly tap cards) */}
      <div className="space-y-2.5">
        {/* 1. Forms */}
        <div
          onClick={() => toggleItem('formsSetAndBraced')}
          className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-center justify-between touch-manipulation min-h-[58px] ${
            checklist.formsSetAndBraced
              ? 'bg-slate-900 border-emerald-500/80'
              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                checklist.formsSetAndBraced
                  ? 'bg-emerald-500 text-slate-950'
                  : 'border-2 border-slate-600'
              }`}
            >
              {checklist.formsSetAndBraced && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
            </div>
            <div className="text-sm font-bold text-white">
              {t(language, 'chkForms')}
            </div>
          </div>
        </div>

        {/* 2. Rebar */}
        <div
          onClick={() => toggleItem('rebarMeshInPlace')}
          className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-center justify-between touch-manipulation min-h-[58px] ${
            checklist.rebarMeshInPlace
              ? 'bg-slate-900 border-emerald-500/80'
              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                checklist.rebarMeshInPlace
                  ? 'bg-emerald-500 text-slate-950'
                  : 'border-2 border-slate-600'
              }`}
            >
              {checklist.rebarMeshInPlace && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
            </div>
            <div className="text-sm font-bold text-white">
              {t(language, 'chkRebar')}
            </div>
          </div>
        </div>

        {/* 3. Subgrade */}
        <div
          onClick={() => toggleItem('subgradeCompacted')}
          className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-center justify-between touch-manipulation min-h-[58px] ${
            checklist.subgradeCompacted
              ? 'bg-slate-900 border-emerald-500/80'
              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                checklist.subgradeCompacted
                  ? 'bg-emerald-500 text-slate-950'
                  : 'border-2 border-slate-600'
              }`}
            >
              {checklist.subgradeCompacted && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
            </div>
            <div className="text-sm font-bold text-white">
              {t(language, 'chkSubgrade')}
            </div>
          </div>
        </div>

        {/* 4. Inspection */}
        <div
          onClick={() => toggleItem('inspectionPassed')}
          className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-center justify-between touch-manipulation min-h-[58px] ${
            checklist.inspectionPassed
              ? 'bg-slate-900 border-emerald-500/80'
              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                checklist.inspectionPassed
                  ? 'bg-emerald-500 text-slate-950'
                  : 'border-2 border-slate-600'
              }`}
            >
              {checklist.inspectionPassed && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
            </div>
            <div className="text-sm font-bold text-white">
              {t(language, 'chkInspection')}
            </div>
          </div>
        </div>

        {/* 5. Crew on Site */}
        <div
          onClick={() => toggleItem('crewOnSite')}
          className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-center justify-between touch-manipulation min-h-[58px] ${
            checklist.crewOnSite
              ? 'bg-slate-900 border-emerald-500/80'
              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                checklist.crewOnSite
                  ? 'bg-emerald-500 text-slate-950'
                  : 'border-2 border-slate-600'
              }`}
            >
              {checklist.crewOnSite && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
            </div>
            <div className="text-sm font-bold text-white">
              {t(language, 'chkCrew')}
            </div>
          </div>
        </div>

        {/* 6. Pump Booked (If pump mix selected) */}
        {isPumpPlacement && (
          <div
            onClick={() => toggleItem('pumpBooked')}
            className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-center justify-between touch-manipulation min-h-[58px] ${
              checklist.pumpBooked
                ? 'bg-slate-900 border-emerald-500/80'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                  checklist.pumpBooked
                    ? 'bg-emerald-500 text-slate-950'
                    : 'border-2 border-slate-600'
                }`}
              >
                {checklist.pumpBooked && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
              </div>
              <div className="text-sm font-bold text-white">
                {t(language, 'chkPump')}
              </div>
            </div>
          </div>
        )}

        {/* 7. Truck Access Clear */}
        <div
          onClick={() => toggleItem('truckAccessOk')}
          className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-center justify-between touch-manipulation min-h-[58px] ${
            checklist.truckAccessOk
              ? 'bg-slate-900 border-emerald-500/80'
              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                checklist.truckAccessOk
                  ? 'bg-emerald-500 text-slate-950'
                  : 'border-2 border-slate-600'
              }`}
            >
              {checklist.truckAccessOk && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
            </div>
            <div className="text-sm font-bold text-white">
              {t(language, 'chkAccess')}
            </div>
          </div>
        </div>
      </div>

      {/* Warning Box for Unchecked Items */}
      {hasUnchecked ? (
        <div className="bg-rose-950/50 border-2 border-rose-500 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-black text-rose-300 uppercase tracking-wide">
                {t(language, 'checklistWarningTitle')}
              </div>
              <div className="text-xs text-rose-100 font-semibold mt-1 leading-snug">
                "{t(language, 'checklistWarningText')}"
              </div>
            </div>
          </div>

          {/* Mandatory Acknowledgment Checkbox */}
          <div className="pt-2 border-t border-rose-800/60">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checklist.acknowledgedWarning}
                onChange={() => toggleItem('acknowledgedWarning')}
                className="w-5 h-5 rounded bg-slate-950 border-rose-400 text-rose-500 focus:ring-rose-400 cursor-pointer"
              />
              <span className="text-xs font-bold text-rose-200">
                {t(language, 'acknowledgeChecklist')}
              </span>
            </label>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/60 border-2 border-emerald-500 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">
            Site verified ready! All forms, crew, subgrade, and access are confirmed.
          </span>
        </div>
      )}

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
          disabled={hasUnchecked && !checklist.acknowledgedWarning}
          onClick={onNext}
          className="flex-[2] min-h-[52px] py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-400/25 transition disabled:opacity-50 touch-manipulation cursor-pointer border-2 border-amber-300"
        >
          <span>Review Supplier Penalties</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Camera, Ruler, Layers, Box, Truck, ClipboardCheck, AlertTriangle, CreditCard, Check } from 'lucide-react';
import type { Language } from '../types/index.ts';

interface StepProgressProps {
  currentStep: number;
  totalSteps?: number;
  onStepClick: (step: number) => void;
  language: Language;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  totalSteps = 9,
  onStepClick,
}) => {
  const stepIcons = [
    Camera,          // 1 Photo
    Ruler,           // 2 Outline
    Ruler,           // 3 Scale
    Layers,          // 4 Depth & Mix
    Box,             // 5 Volume
    Truck,           // 6 Delivery
    ClipboardCheck,  // 7 Checklist
    AlertTriangle,   // 8 Penalties
    CreditCard,      // 9 Summary & Pay
  ];

  const stepShortLabels = [
    'Photo',
    'Outline',
    'Scale',
    'Mix',
    'Volume',
    'Delivery',
    'Checklist',
    'Penalties',
    'Payment',
  ];

  return (
    <div className="w-full bg-slate-900/90 border-b border-slate-800 py-2.5 px-3">
      {/* Step Numbers & Title */}
      <div className="flex items-center justify-between text-xs mb-2 text-slate-300">
        <span className="font-extrabold uppercase tracking-wider text-amber-400">
          Step {currentStep} of {totalSteps}: {stepShortLabels[currentStep - 1]}
        </span>
        <span className="font-mono text-slate-400">
          {Math.round((currentStep / totalSteps) * 100)}%
        </span>
      </div>

      {/* Progress Bars / Nodes */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalSteps }, (_, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <button
              key={stepNum}
              type="button"
              disabled={stepNum > currentStep}
              onClick={() => onStepClick(stepNum)}
              className={`flex-1 h-2 rounded-full transition-all touch-manipulation ${
                isCompleted
                  ? 'bg-emerald-500 hover:bg-emerald-400 cursor-pointer'
                  : isCurrent
                  ? 'bg-amber-400 ring-2 ring-amber-400/50'
                  : 'bg-slate-800'
              }`}
              title={`Step ${stepNum}: ${stepShortLabels[idx]}`}
            />
          );
        })}
      </div>
    </div>
  );
};

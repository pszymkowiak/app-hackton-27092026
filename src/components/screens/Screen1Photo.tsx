import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import type { Language } from '../../types/index.ts';
import { t } from '../../utils/i18n.ts';
import { createSampleSlabImage } from '../../utils/sampleImages.ts';

interface Screen1PhotoProps {
  language: Language;
  photoUrl: string | null;
  onPhotoSelected: (dataUrl: string) => void;
  onNext: () => void;
}

export const Screen1Photo: React.FC<Screen1PhotoProps> = ({
  language,
  photoUrl,
  onPhotoSelected,
  onNext,
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onPhotoSelected(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sampleType: 'patio' | 'driveway' | 'foundation') => {
    const sampleUrl = createSampleSlabImage(sampleType);
    onPhotoSelected(sampleUrl);
  };

  return (
    <div className="space-y-4">
      {/* Tip Banner */}
      <div className="bg-amber-950/40 border-2 border-amber-500/80 rounded-xl p-3.5 flex items-start gap-3 shadow-md">
        <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
            Foreman Camera Tip
          </div>
          <div className="text-sm font-semibold text-slate-100 mt-0.5 leading-snug">
            "{t(language, 'screen1Subtitle')}"
          </div>
          <div className="text-xs text-slate-300 mt-1">
            {t(language, 'cameraTip')}
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Current Photo Preview or Placeholder */}
      {photoUrl ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl bg-slate-950">
          <img
            src={photoUrl}
            alt="Slab pour area"
            className="w-full max-h-[360px] object-contain bg-slate-950 mx-auto"
          />
          <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-400 border border-amber-400/40 shadow-md">
            Photo Ready
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center bg-slate-900/60">
          <div className="w-16 h-16 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Camera className="w-8 h-8" />
          </div>
          <div className="text-base font-bold text-white">
            {t(language, 'screen1Title')}
          </div>
          <div className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Take a clear overhead photo of the wooden forms or rebar area to measure and estimate ready-mix.
          </div>
        </div>
      )}

      {/* Primary Action Buttons (Glove-Friendly Touch Targets) */}
      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="w-full min-h-[58px] py-4 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black text-lg tracking-wide shadow-lg shadow-amber-400/25 flex items-center justify-center gap-3 transition touch-manipulation cursor-pointer border-2 border-amber-300"
        >
          <Camera className="w-6 h-6 stroke-[2.5]" />
          <span>{t(language, 'takePhotoButton')}</span>
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="w-full min-h-[52px] py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base flex items-center justify-center gap-2.5 transition border border-slate-700 touch-manipulation cursor-pointer"
        >
          <ImageIcon className="w-5 h-5 text-slate-300" />
          <span>{t(language, 'uploadGalleryButton')}</span>
        </button>
      </div>

      {/* Preset Demo Job Site Photos for instant evaluation */}
      <div className="pt-2 border-t border-slate-800">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{t(language, 'samplePhotosTitle')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleSelectSample('patio')}
            className="p-3 text-left rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 transition group cursor-pointer"
          >
            <div className="text-xs font-bold text-amber-300 group-hover:text-amber-400">
              {t(language, 'samplePatio')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Wood 2x4 forms with gravel base
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSample('driveway')}
            className="p-3 text-left rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 transition group cursor-pointer"
          >
            <div className="text-xs font-bold text-amber-300 group-hover:text-amber-400">
              {t(language, 'sampleDriveway')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Long formwork with #4 rebar grid
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSample('foundation')}
            className="p-3 text-left rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 transition group cursor-pointer"
          >
            <div className="text-xs font-bold text-amber-300 group-hover:text-amber-400">
              {t(language, 'sampleFoundation')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Heavy braced forms & mat
            </div>
          </button>
        </div>
      </div>

      {/* Next Step Button (if photo loaded) */}
      {photoUrl && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onNext}
            className="w-full min-h-[54px] py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition cursor-pointer"
          >
            <span>Proceed to Outline Detection</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
};

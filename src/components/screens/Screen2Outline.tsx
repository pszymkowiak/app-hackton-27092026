import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RotateCcw, Trash2, Plus, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import type { Language, Point, OutlineResult } from '../../types/index.ts';
import { t } from '../../utils/i18n.ts';

interface Screen2OutlineProps {
  language: Language;
  photoUrl: string;
  outlineResult: OutlineResult | null;
  onOutlineUpdated: (result: OutlineResult) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Screen2Outline: React.FC<Screen2OutlineProps> = ({
  language,
  photoUrl,
  outlineResult,
  onOutlineUpdated,
  onNext,
  onBack,
}) => {
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<Point[]>(outlineResult?.polygon || []);
  const [confidence, setConfidence] = useState<number>(outlineResult?.confidence ?? 0.85);
  const [reason, setReason] = useState<string>(outlineResult?.reason || '');
  const [autoPoints, setAutoPoints] = useState<Point[]>(outlineResult?.polygon || []);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const [isAddMode, setIsAddMode] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Automatically request Gemini outline on initial mount if not yet detected
  useEffect(() => {
    if (!outlineResult || outlineResult.polygon.length === 0) {
      detectOutlineFromGemini();
    }
  }, [photoUrl]);

  const detectOutlineFromGemini = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: photoUrl,
          mimeType: photoUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data: OutlineResult = await response.json();
      setPoints(data.polygon);
      setAutoPoints(data.polygon);
      setConfidence(data.confidence);
      setReason(data.reason);

      onOutlineUpdated(data);
    } catch (err) {
      console.warn('Auto-detect error, setting manual points:', err);
      // Fallback default 4 corners for manual drawing
      const fallbackPoints: Point[] = [
        { x: 0.15, y: 0.2 },
        { x: 0.85, y: 0.2 },
        { x: 0.85, y: 0.8 },
        { x: 0.15, y: 0.8 },
      ];
      setPoints(fallbackPoints);
      setAutoPoints(fallbackPoints);
      setConfidence(0.3);
      setReason("Auto-detect didn't find clear forms. Tap to draw or adjust points.");
      onOutlineUpdated({
        polygon: fallbackPoints,
        confidence: 0.3,
        reason: "Auto-detect didn't work, draw it yourself",
      });
    } finally {
      setLoading(false);
    }
  };

  const getContainerCoords = (clientX: number, clientY: number): Point | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handlePointerDownPoint = (index: number, e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(index);
    setSelectedPointIndex(index);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging === null) return;
    const coords = getContainerCoords(e.clientX, e.clientY);
    if (!coords) return;

    setPoints((prev) => {
      const updated = [...prev];
      updated[isDragging] = coords;
      return updated;
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging !== null) {
      setIsDragging(null);
      saveCurrentPoints(points);
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (isDragging !== null) return;
    const coords = getContainerCoords(e.clientX, e.clientY);
    if (!coords) return;

    if (isAddMode || points.length < 3) {
      const newPoints = [...points, coords];
      setPoints(newPoints);
      saveCurrentPoints(newPoints);
      setSelectedPointIndex(newPoints.length - 1);
    } else {
      // Deselect point if clicked empty background
      setSelectedPointIndex(null);
    }
  };

  // Tap an edge to insert a point in between
  const handleEdgeClick = (edgeIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const coords = getContainerCoords(e.clientX, e.clientY);
    if (!coords) return;

    const newPoints = [...points];
    newPoints.splice(edgeIndex + 1, 0, coords);
    setPoints(newPoints);
    saveCurrentPoints(newPoints);
    setSelectedPointIndex(edgeIndex + 1);
  };

  const handleDeleteSelectedPoint = () => {
    if (selectedPointIndex === null || points.length <= 3) return;
    const newPoints = points.filter((_, idx) => idx !== selectedPointIndex);
    setPoints(newPoints);
    saveCurrentPoints(newPoints);
    setSelectedPointIndex(null);
  };

  const handleResetToAuto = () => {
    setPoints(autoPoints);
    saveCurrentPoints(autoPoints);
    setSelectedPointIndex(null);
  };

  const handleClearAll = () => {
    setPoints([]);
    saveCurrentPoints([]);
    setSelectedPointIndex(null);
    setIsAddMode(true);
  };

  const saveCurrentPoints = (pts: Point[]) => {
    onOutlineUpdated({
      polygon: pts,
      confidence,
      reason,
      roughEstimate: outlineResult?.roughEstimate,
    });
  };

  const isLowConfidence = confidence < 0.6 || points.length === 0;

  return (
    <div className="space-y-4">
      {/* Header Info Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
        <div>
          <div className="text-base font-bold text-white flex items-center gap-2">
            <span>{t(language, 'screen2Title')}</span>
            {loading && <span className="animate-spin text-amber-400">⏳</span>}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {t(language, 'screen2Subtitle')}
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
              confidence >= 0.75
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                : confidence >= 0.5
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                : 'bg-rose-950/80 text-rose-300 border-rose-500/50'
            }`}
          >
            <span>{Math.round(confidence * 100)}%</span>
            <span>
              {confidence >= 0.75
                ? t(language, 'highConfidence')
                : confidence >= 0.5
                ? t(language, 'mediumConfidence')
                : t(language, 'lowConfidence')}
            </span>
          </div>
        </div>
      </div>

      {/* Low Confidence or No Outline Warning */}
      {isLowConfidence && !loading && (
        <div className="bg-amber-950/50 border-2 border-amber-500/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-extrabold text-amber-300 text-sm">
              {t(language, 'lowConfidenceWarning')}
            </div>
            <div className="mt-0.5 text-slate-300">
              Tap anywhere on the photo to place polygon corners around your slab formwork.
            </div>
          </div>
        </div>
      )}

      {/* AI Reasoning Note */}
      {reason && !loading && (
        <div className="text-xs text-slate-400 bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-800 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{reason}</span>
        </div>
      )}

      {/* Interactive Photo Canvas Area */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleContainerClick}
        className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-amber-400/80 shadow-2xl select-none touch-none cursor-crosshair"
      >
        {/* Background Photo */}
        <img
          src={photoUrl}
          alt="Slab pour area"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-20">
            <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-3" />
            <div className="text-white font-bold text-base">
              {t(language, 'aiDetecting')}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Identifying 2x4 form boards, perimeter stakes & rebar grid
            </div>
          </div>
        )}

        {/* SVG Polygon and Edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Shaded polygon fill */}
          {points.length >= 3 && (
            <polygon
              points={points.map((p) => `${p.x * 100}%,${p.y * 100}%`).join(' ')}
              fill="rgba(250, 204, 21, 0.28)"
              stroke="#facc15"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Edges: Clicking adds a vertex */}
          {points.length >= 2 &&
            points.map((p, i) => {
              const nextP = points[(i + 1) % points.length];
              return (
                <line
                  key={`edge-${i}`}
                  x1={`${p.x * 100}%`}
                  y1={`${p.y * 100}%`}
                  x2={`${nextP.x * 100}%`}
                  y2={`${nextP.y * 100}%`}
                  stroke="transparent"
                  strokeWidth="24"
                  className="pointer-events-auto cursor-copy"
                  onClick={(e) => handleEdgeClick(i, e)}
                />
              );
            })}
        </svg>

        {/* Draggable Corner Handles (Glove-Friendly Touch Area) */}
        {points.map((p, idx) => {
          const isSelected = selectedPointIndex === idx;
          const isBeingDragged = isDragging === idx;

          return (
            <div
              key={`handle-${idx}`}
              onPointerDown={(e) => handlePointerDownPoint(idx, e)}
              style={{
                left: `${p.x * 100}%`,
                top: `${p.y * 100}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 touch-none flex items-center justify-center w-12 h-12 cursor-grab active:cursor-grabbing group"
            >
              {/* Outer touch target ring */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-lg ${
                  isSelected || isBeingDragged
                    ? 'bg-amber-400 ring-4 ring-amber-300/80 scale-125'
                    : 'bg-slate-900 border-2 border-amber-400 group-hover:scale-110'
                }`}
              >
                {/* Central anchor dot */}
                <div
                  className={`w-3 h-3 rounded-full ${
                    isSelected || isBeingDragged ? 'bg-slate-950' : 'bg-amber-400'
                  }`}
                />
              </div>

              {/* Point index label */}
              <div className="absolute -top-4 bg-slate-950/90 text-amber-400 text-[10px] font-mono px-1 rounded border border-slate-700 pointer-events-none">
                {idx + 1}
              </div>
            </div>
          );
        })}

        {/* Touch Helper Overlay */}
        <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-[11px] text-slate-300 flex items-center justify-between pointer-events-none shadow-md">
          <span>{t(language, 'tapToAddPoint')}</span>
          <span className="font-mono text-amber-400 font-bold">{points.length} vertices</span>
        </div>
      </div>

      {/* Editing Toolbelt Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIsAddMode(!isAddMode)}
          className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
            isAddMode
              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{isAddMode ? 'Add Mode Active (Tap photo)' : 'Add Point Mode'}</span>
        </button>

        {selectedPointIndex !== null && points.length > 3 && (
          <button
            type="button"
            onClick={handleDeleteSelectedPoint}
            className="min-h-[44px] py-2.5 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete #{selectedPointIndex + 1}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleResetToAuto}
          className="min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>{t(language, 'resetToAuto')}</span>
        </button>

        <button
          type="button"
          onClick={handleClearAll}
          className="min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
        >
          <span>{t(language, 'clearAllPoints')}</span>
        </button>
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
          disabled={points.length < 3}
          onClick={onNext}
          className="flex-[2] min-h-[52px] py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-400/25 transition disabled:opacity-50 touch-manipulation cursor-pointer border-2 border-amber-300"
        >
          <span>Set Real Scale</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

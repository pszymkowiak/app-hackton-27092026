import React, { useState, useEffect } from 'react';
import {
  Truck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Hourglass,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  Sparkles,
  MapPin,
  Calendar,
} from 'lucide-react';
import type { Language, UnitSystem, OrderRecord, TruckItem } from '../../types/index.ts';
import { t } from '../../utils/i18n.ts';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase.ts';

interface ForemanTrackingViewProps {
  language: Language;
  units: UnitSystem;
  order: OrderRecord;
  onOrderUpdated: (order: OrderRecord) => void;
  onNewOrder: () => void;
}

export const ForemanTrackingView: React.FC<ForemanTrackingViewProps> = ({
  language,
  units,
  order: initialOrder,
  onOrderUpdated,
  onNewOrder,
}) => {
  const [order, setOrder] = useState<OrderRecord>(initialOrder);
  const [leftoverInput, setLeftoverInput] = useState<string>(
    order.actualLeftoverYd3 !== undefined ? order.actualLeftoverYd3.toString() : '0'
  );
  const [recapSaved, setRecapSaved] = useState<boolean>(!!order.recapCompleted);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Listen for real-time Firestore updates on this order
  useEffect(() => {
    if (!order.id) return;
    const orderPath = `orders/${order.id}`;
    const unsubscribe = onSnapshot(
      doc(db, 'orders', order.id),
      (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data() as OrderRecord;
          setOrder(remoteData);
          onOrderUpdated(remoteData);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, orderPath);
      }
    );

    return () => unsubscribe();
  }, [order.id]);

  // Live timer tick every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const stages = [
    { key: 'preparing', label: t(language, 'stage1') },
    { key: 'concrete_ok', label: t(language, 'stage2') },
    { key: 'on_the_way', label: t(language, 'stage3') },
    { key: 'delivering', label: t(language, 'stage4') },
    { key: 'finished', label: t(language, 'stage5') },
    { key: 'returning', label: t(language, 'stage6') },
  ];

  const getStageIndex = (status: string) => {
    const idx = stages.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  const handleSaveRecap = async () => {
    const leftoverNum = parseFloat(leftoverInput) || 0;
    const updatedOrder: OrderRecord = {
      ...order,
      actualLeftoverYd3: leftoverNum,
      recapCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    setOrder(updatedOrder);
    setRecapSaved(true);
    onOrderUpdated(updatedOrder);

    const orderPath = `orders/${order.id}`;
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        actualLeftoverYd3: leftoverNum,
        recapCompleted: true,
        updatedAt: updatedOrder.updatedAt,
      });
    } catch (err) {
      console.warn('Firestore update failed:', err);
    }
  };

  const sym = order.currencySymbol || '€';
  const waitingFeeRatePerMin = 2.5; // per minute
  let totalLiveWaitingFees = 0;

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
              {t(language, 'foremanTrackingTitle')}
            </div>
            <div className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
              <span>{order.id}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/50">
                {t(language, 'statusConfirmed')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onNewOrder}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700 cursor-pointer"
          >
            + {t(language, 'newOrderButton')}
          </button>
        </div>

        {/* Quick summary badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs">
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Volume</span>
            <span className="font-mono font-bold text-white">
              {units === 'imperial' ? `${order.finalVolumeYd3} yd³` : `${order.finalVolumeM3} m³`}
            </span>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Mix Spec</span>
            <span className="font-bold text-amber-300 truncate block">
              {order.concreteMix.strength}
            </span>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Plant</span>
            <span className="font-bold text-slate-200 truncate block">
              {order.supplierName}
            </span>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Destination</span>
            <span className="font-bold text-slate-200 truncate block">
              {order.address}
            </span>
          </div>
        </div>
      </div>

      {/* List of Truck Cards with Live Timers and Stage Timeline */}
      <div className="space-y-4">
        {order.trucks.map((truck) => {
          const currentStageIdx = getStageIndex(truck.status);

          // 1. Concrete Window: Time elapsed since batching (in seconds)
          let batchElapsedSeconds = 0;
          if (truck.batchTime) {
            batchElapsedSeconds = Math.max(0, Math.floor((currentTime - truck.batchTime) / 1000));
          } else {
            batchElapsedSeconds = 0;
          }

          const batchElapsedMins = Math.floor(batchElapsedSeconds / 60);
          const isWindowOrange = batchElapsedMins >= 60 && batchElapsedMins < 90;
          const isWindowRed = batchElapsedMins >= 90;

          // 2. Free Unloading Time Countdown (e.g. 45 min)
          // Active when truck is in 'delivering' status
          const freeTimeTotalSeconds = 45 * 60; // 45 minutes
          let remainingFreeSeconds = freeTimeTotalSeconds;
          let overtimeMinutes = 0;
          let liveWaitingFee = 0;

          if (truck.status === 'delivering' && truck.arrivalTime) {
            const unloadingElapsedSeconds = Math.floor((currentTime - truck.arrivalTime) / 1000);
            if (unloadingElapsedSeconds <= freeTimeTotalSeconds) {
              remainingFreeSeconds = freeTimeTotalSeconds - unloadingElapsedSeconds;
            } else {
              remainingFreeSeconds = 0;
              const overtimeSeconds = unloadingElapsedSeconds - freeTimeTotalSeconds;
              overtimeMinutes = Math.ceil(overtimeSeconds / 60);
              liveWaitingFee = overtimeMinutes * waitingFeeRatePerMin;
              totalLiveWaitingFees += liveWaitingFee;
            }
          } else if (truck.status === 'finished' || truck.status === 'returning') {
            remainingFreeSeconds = 0;
            liveWaitingFee = truck.waitingFeeIncurred || 0;
            totalLiveWaitingFees += liveWaitingFee;
          }

          const freeMinutesPart = Math.floor(remainingFreeSeconds / 60);
          const freeSecondsPart = remainingFreeSeconds % 60;

          return (
            <div
              key={truck.truckNumber}
              className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 shadow-xl space-y-3.5"
            >
              {/* Truck Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-md">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-black text-white flex items-center gap-2">
                      <span>{t(language, 'truckCardHeader')} #{truck.truckNumber}</span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        ({units === 'imperial' ? `${truck.volumeYd3} yd³` : `${truck.volumeM3} m³`})
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {stages[currentStageIdx]?.label}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    {truck.status === 'on_the_way'
                      ? `ETA: ${truck.etaMinutes} min`
                      : truck.status === 'delivering'
                      ? 'ON SITE'
                      : truck.status === 'finished'
                      ? 'POURED'
                      : 'AT PLANT'}
                  </div>
                </div>
              </div>

              {/* TWO LIVE TIMERS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Timer 1: Concrete Window (90 min max) */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isWindowRed
                      ? 'bg-rose-950/60 border-rose-500 animate-pulse text-rose-200'
                      : isWindowOrange
                      ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t(language, 'timerConcreteWindow')}</span>
                    </div>
                    <div className="text-xl font-mono font-black mt-0.5">
                      {truck.batchTime ? (
                        <>
                          {batchElapsedMins}m {batchElapsedSeconds % 60}s
                        </>
                      ) : (
                        'Awaiting Batch'
                      )}
                    </div>
                  </div>

                  <div className="text-right text-[10px]">
                    {isWindowRed ? (
                      <span className="px-2 py-0.5 bg-rose-600 text-white font-black rounded uppercase">
                        Window Exceeded!
                      </span>
                    ) : isWindowOrange ? (
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black rounded uppercase">
                        Place Soon (&gt;60m)
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold">Good to pour</span>
                    )}
                  </div>
                </div>

                {/* Timer 2: Free Unloading Time Countdown & Live Standby Waiting Fee */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    liveWaitingFee > 0
                      ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Hourglass className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {liveWaitingFee > 0 ? t(language, 'waitingFeeLive') : t(language, 'timerFreeUnload')}
                      </span>
                    </div>

                    <div className="text-xl font-mono font-black mt-0.5">
                      {liveWaitingFee > 0 ? (
                        <span className="text-rose-400 font-mono font-black">
                          +{sym}{liveWaitingFee.toFixed(2)}{' '}
                          <span className="text-xs font-normal text-rose-300">
                            ({overtimeMinutes}m @ {sym}2.50/m)
                          </span>
                        </span>
                      ) : truck.status === 'delivering' ? (
                        <span className="text-emerald-400">
                          {String(freeMinutesPart).padStart(2, '0')}:
                          {String(freeSecondsPart).padStart(2, '0')}
                        </span>
                      ) : truck.status === 'finished' ? (
                        <span className="text-slate-400">Completed</span>
                      ) : (
                        <span className="text-slate-500">45:00 on arrival</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-[10px]">
                    {liveWaitingFee > 0 ? (
                      <span className="px-2 py-0.5 bg-rose-600 text-white font-black rounded uppercase">
                        Overtime
                      </span>
                    ) : (
                      <span className="text-slate-400">45 min free</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Timeline (6 Stages) */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Delivery Timeline
                </div>

                <div className="space-y-1.5">
                  {stages.map((stg, sIdx) => {
                    const isPassed = sIdx <= currentStageIdx;
                    const isCurrent = sIdx === currentStageIdx;

                    return (
                      <div
                        key={stg.key}
                        className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between border transition ${
                          isCurrent
                            ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold'
                            : isPassed
                            ? 'bg-slate-950/70 border-slate-800 text-slate-300'
                            : 'bg-slate-950/30 border-transparent text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                              isCurrent
                                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/40'
                                : isPassed
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isPassed && !isCurrent ? '✓' : sIdx + 1}
                          </div>
                          <span>{stg.label}</span>
                        </div>

                        {/* Timestamp indicator */}
                        <div className="font-mono text-[10px] text-slate-400">
                          {isCurrent
                            ? 'IN PROGRESS'
                            : isPassed
                            ? 'Completed'
                            : 'Pending'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* JOB RECAP & LEFTOVER ANALYSIS SECTION */}
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="text-sm font-black text-white flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>{t(language, 'recapHeading')}</span>
          </div>

          {recapSaved && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-xs font-bold border border-emerald-500/40">
              Recap Finalized
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {t(language, 'actualLeftoverLabel')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.25"
                min="0"
                value={leftoverInput}
                onChange={(e) => setLeftoverInput(e.target.value)}
                className="w-32 h-11 px-3 bg-slate-950 border-2 border-slate-700 focus:border-amber-400 rounded-xl text-base font-bold text-white font-mono text-center"
              />
              <button
                type="button"
                onClick={handleSaveRecap}
                className="h-11 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                {t(language, 'finalizeRecap')}
              </button>
            </div>
          </div>

          {/* Fees incurred summary */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">{t(language, 'totalStandbyFees')}:</span>
              <span className="font-mono font-bold text-amber-400">
                {sym}{totalLiveWaitingFees.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{t(language, 'returnedFeeTotal')}:</span>
              <span className="font-mono font-bold text-rose-400">
                {sym}{(parseFloat(leftoverInput || '0') * 85).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Actionable Foreman Tip Card */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/40 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {t(language, 'foremanTipTitle')}
            </div>
            <div className="text-xs text-slate-300 mt-1 leading-relaxed">
              {parseFloat(leftoverInput || '0') > 0 ? (
                <>
                  Returning {leftoverInput} yd³ cost ${(parseFloat(leftoverInput) * 85).toFixed(2)} in disposal + raw mud. Calibrating forms with your 10-ft tape in Step 3 helped keep waste margin tight.
                </>
              ) : (
                <>{t(language, 'foremanTipSaved')}</>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

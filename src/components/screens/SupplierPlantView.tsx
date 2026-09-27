import React, { useState, useEffect } from 'react';
import {
  Factory,
  Play,
  Pause,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import type { Language, UnitSystem, OrderRecord, TruckItem } from '../../types/index.ts';
import { t } from '../../utils/i18n.ts';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase.ts';

interface SupplierPlantViewProps {
  language: Language;
  units: UnitSystem;
  onSelectOrderForForeman?: (order: OrderRecord) => void;
}

export const SupplierPlantView: React.FC<SupplierPlantViewProps> = ({
  language,
  units,
  onSelectOrderForForeman,
}) => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [advancingTruckId, setAdvancingTruckId] = useState<string | null>(null);

  // Subscribe to real-time orders in Firestore
  useEffect(() => {
    const ordersPath = 'orders';
    const unsubscribe = onSnapshot(
      collection(db, ordersPath),
      (snapshot) => {
        const remoteOrders: OrderRecord[] = [];
        snapshot.forEach((d) => {
          remoteOrders.push(d.data() as OrderRecord);
        });
        // Sort newest first
        remoteOrders.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(remoteOrders);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, ordersPath);
      }
    );

    return () => unsubscribe();
  }, []);

  // Demo mode auto-advance interval (every 20 seconds)
  useEffect(() => {
    if (!demoMode) return;

    const interval = setInterval(() => {
      autoAdvanceNextTruck();
    }, 20000); // 20 seconds

    return () => clearInterval(interval);
  }, [demoMode, orders]);

  const stagesList: Array<TruckItem['status']> = [
    'preparing',
    'concrete_ok',
    'on_the_way',
    'delivering',
    'finished',
    'returning',
  ];

  const advanceTruckStatus = async (orderId: string, truckNum: number) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    setAdvancingTruckId(`${orderId}-${truckNum}`);

    const updatedTrucks = targetOrder.trucks.map((trk) => {
      if (trk.truckNumber === truckNum) {
        const curIdx = stagesList.indexOf(trk.status);
        const nextStatus = stagesList[Math.min(stagesList.length - 1, curIdx + 1)];

        const now = Date.now();
        const updated: TruckItem = {
          ...trk,
          status: nextStatus,
        };

        if (nextStatus === 'concrete_ok' && !trk.batchTime) {
          updated.batchTime = now;
        } else if (nextStatus === 'on_the_way') {
          updated.departTime = now;
        } else if (nextStatus === 'delivering') {
          updated.arrivalTime = now;
        } else if (nextStatus === 'finished') {
          updated.finishTime = now;
          if (trk.arrivalTime) {
            const mins = Math.max(0, Math.floor((now - trk.arrivalTime) / 60000) - 45);
            updated.waitingMinutesIncurred = mins;
            updated.waitingFeeIncurred = mins * 2.5;
          }
        }
        return updated;
      }
      return trk;
    });

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        trucks: updatedTrucks,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Update truck status error:', err);
    } finally {
      setAdvancingTruckId(null);
    }
  };

  const autoAdvanceNextTruck = () => {
    for (const ord of orders) {
      for (const trk of ord.trucks) {
        if (trk.status !== 'returning' && trk.status !== 'finished') {
          advanceTruckStatus(ord.id, trk.truckNumber);
          return;
        }
      }
    }
  };

  const handleSeedDemoOrder = async () => {
    const sampleId = `SR-${Math.floor(100000 + Math.random() * 900000)}`;
    const demoOrder: OrderRecord = {
      id: sampleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'confirmed',
      country: 'FR',
      currency: 'EUR',
      currencySymbol: '€',
      customerName: 'Ray Ramirez (Foreman)',
      customerPhone: '(555) 749-3011',
      address: '742 Evergreen Way, Section 4',
      accessNotes: 'Gate #4012, beware low overhead telephone line on west approach',
      deliveryDate: new Date().toISOString().split('T')[0],
      deliveryTimeSlot: '08:30 AM',
      supplierId: 'apex-ready-mix',
      supplierName: 'Apex Ready-Mix Co.',
      concreteMix: {
        strength: '4000 PSI',
        slump: '4 in (Standard Flatwork)',
        maxAggregate: '3/4 in (Standard)',
        airEntrained: true,
        fibers: false,
        placement: 'chute',
      },
      areaSqFt: 420,
      areaSqM: 39,
      depthInches: 4,
      depthCm: 10,
      baseVolumeYd3: 5.19,
      baseVolumeM3: 3.9,
      wastePercent: 5,
      finalVolumeYd3: 5.5,
      finalVolumeM3: 4.2,
      manualOverride: false,
      truckloadsCount: 2,
      trucks: [
        {
          truckNumber: 1,
          volumeYd3: 3.0,
          volumeM3: 2.3,
          status: 'delivering',
          batchTime: Date.now() - 40 * 60 * 1000, // 40 mins ago
          departTime: Date.now() - 20 * 60 * 1000,
          arrivalTime: Date.now() - 5 * 60 * 1000, // 5 mins on site
          finishTime: null,
          etaMinutes: 0,
          waitingMinutesIncurred: 0,
          waitingFeeIncurred: 0,
        },
        {
          truckNumber: 2,
          volumeYd3: 2.5,
          volumeM3: 1.9,
          status: 'preparing',
          batchTime: Date.now() - 10 * 60 * 1000,
          departTime: null,
          arrivalTime: null,
          finishTime: null,
          etaMinutes: 20,
          waitingMinutesIncurred: 0,
          waitingFeeIncurred: 0,
        },
      ],
      pricing: {
        concreteCost: 814.0,
        deliveryFee: 130.0,
        shortLoadFee: 0,
        depositPaid: 141.6,
        totalEstimated: 944.0,
      },
      checklist: {
        formsSetAndBraced: true,
        rebarMeshInPlace: true,
        subgradeCompacted: true,
        inspectionPassed: false, // Flagged for testing!
        crewOnSite: true,
        pumpBooked: false,
        truckAccessOk: true,
        acknowledgedWarning: true,
      },
      penaltiesUnderstood: true,
      recapCompleted: false,
    };

    await setDoc(doc(db, 'orders', sampleId), demoOrder);
  };

  return (
    <div className="space-y-4">
      {/* Title & Batch Plant Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
              Batch Plant Console
            </div>
            <div className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
              <Factory className="w-5 h-5 text-amber-400" />
              <span>{t(language, 'plantTitle')}</span>
            </div>
            <div className="text-xs text-slate-400">
              {t(language, 'plantSubtitle')}
            </div>
          </div>

          {/* Demo Mode Toggle (Advances every 20 seconds) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDemoMode(!demoMode)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition shadow-md touch-manipulation cursor-pointer ${
                demoMode
                  ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {demoMode ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-amber-400 text-amber-400" />}
              <span>{t(language, 'demoModeToggle')}</span>
            </button>

            {orders.length === 0 && (
              <button
                type="button"
                onClick={handleSeedDemoOrder}
                className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition cursor-pointer"
              >
                + Seed Test Order
              </button>
            )}
          </div>
        </div>

        {/* Demo Mode Active Banner */}
        {demoMode && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-2 text-xs text-emerald-300 animate-pulse">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{t(language, 'demoModeActive')}</span>
          </div>
        )}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <Factory className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="text-sm font-bold text-slate-300">
            {t(language, 'noOrdersYet')}
          </div>
          <button
            type="button"
            onClick={handleSeedDemoOrder}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition cursor-pointer"
          >
            Create Sample Dispatch Order
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const hasChecklistWarning =
              !order.checklist.formsSetAndBraced ||
              !order.checklist.rebarMeshInPlace ||
              !order.checklist.subgradeCompacted ||
              !order.checklist.inspectionPassed ||
              !order.checklist.crewOnSite ||
              !order.checklist.truckAccessOk;

            return (
              <div
                key={order.id}
                className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 shadow-xl space-y-3"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white">{order.id}</span>
                      <span className="text-xs font-bold text-slate-400">
                        • {order.customerName}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate max-w-[280px]">{order.address}</span>
                    </div>
                  </div>

                  {/* Site Readiness Badge */}
                  <div className="flex items-center gap-2">
                    {hasChecklistWarning ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-950/90 text-rose-300 border border-rose-500/60 text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>{t(language, 'siteReadyWarningBadge')}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t(language, 'siteReadyOkBadge')}</span>
                      </span>
                    )}

                    {onSelectOrderForForeman && (
                      <button
                        type="button"
                        onClick={() => onSelectOrderForForeman(order)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 border border-slate-700 cursor-pointer"
                      >
                        Track as Foreman
                      </button>
                    )}
                  </div>
                </div>

                {/* Concrete Mix & Access Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Mix Spec</span>
                    <span className="font-bold text-amber-300 truncate block">
                      {order.concreteMix.strength} • {order.concreteMix.slump}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Placement</span>
                    <span className="font-bold text-slate-200 truncate block capitalize">
                      {order.concreteMix.placement}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Time Slot</span>
                    <span className="font-bold text-white truncate block">
                      {order.deliveryTimeSlot}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Total Volume</span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {units === 'imperial' ? `${order.finalVolumeYd3} yd³` : `${order.finalVolumeM3} m³`}
                    </span>
                  </div>
                </div>

                {/* Access notes highlight */}
                {order.accessNotes && (
                  <div className="text-[11px] text-slate-300 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                    <strong className="text-amber-400">Access Note:</strong> {order.accessNotes}
                  </div>
                )}

                {/* Trucks Dispatch Controls */}
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Truck Dispatch Controls
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {order.trucks.map((truck) => {
                      const curIdx = stagesList.indexOf(truck.status);
                      const isLastStage = curIdx >= stagesList.length - 1;
                      const nextStageName = !isLastStage ? stagesList[curIdx + 1] : 'Completed';
                      const isUpdating = advancingTruckId === `${order.id}-${truck.truckNumber}`;

                      return (
                        <div
                          key={truck.truckNumber}
                          className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs">
                              #{truck.truckNumber}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-2">
                                <span>Truck #{truck.truckNumber}</span>
                                <span className="font-mono text-amber-400">
                                  {units === 'imperial' ? `${truck.volumeYd3} yd³` : `${truck.volumeM3} m³`}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 capitalize">
                                Status: <strong className="text-slate-200">{truck.status.replace('_', ' ')}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              disabled={isLastStage || isUpdating}
                              onClick={() => advanceTruckStatus(order.id, truck.truckNumber)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition touch-manipulation cursor-pointer ${
                                isLastStage
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-md'
                              }`}
                            >
                              <span>
                                {isUpdating
                                  ? 'Advancing...'
                                  : isLastStage
                                  ? 'All Done'
                                  : `Advance to: ${nextStageName.replace('_', ' ')}`}
                              </span>
                              {!isLastStage && <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
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
      )}
    </div>
  );
};

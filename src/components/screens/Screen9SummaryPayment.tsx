import React, { useState } from 'react';
import { CreditCard, CheckCircle2, ArrowLeft, Lock, Sparkles, Building2 } from 'lucide-react';
import type {
  Language,
  UnitSystem,
  ConcreteMix,
  Supplier,
  SiteChecklist,
  ScaleConfig,
  OrderRecord,
  TruckItem,
  CountryConfig,
  UserProfile,
} from '../../types/index.ts';
import { t } from '../../utils/i18n.ts';
import { splitTruckloads } from '../../utils/calc.ts';
import { getPoolTier } from '../../utils/pool.ts';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase.ts';

interface Screen9SummaryPaymentProps {
  language: Language;
  units: UnitSystem;
  country: CountryConfig;
  scaleConfig: ScaleConfig;
  depthInches: number;
  finalVolumeYd3: number;
  finalVolumeM3: number;
  wastePercent: number;
  manualOverride: boolean;
  isBalanced: boolean;
  mix: ConcreteMix;
  supplier: Supplier;
  deliveryDate: string;
  deliveryTimeSlot: string;
  deliveryFlexDays?: number;
  address: string;
  accessNotes: string;
  contactName: string;
  contactPhone: string;
  checklist: SiteChecklist;
  understoodPenalties: boolean;
  user?: UserProfile | null;
  onOrderConfirmed: (order: OrderRecord) => void;
  onBack: () => void;
}

export const Screen9SummaryPayment: React.FC<Screen9SummaryPaymentProps> = ({
  language,
  units,
  country,
  scaleConfig,
  depthInches,
  finalVolumeYd3,
  finalVolumeM3,
  wastePercent,
  manualOverride,
  isBalanced,
  mix,
  supplier,
  deliveryDate,
  deliveryTimeSlot,
  deliveryFlexDays = 1,
  address,
  accessNotes,
  contactName,
  contactPhone,
  checklist,
  understoodPenalties,
  user,
  onOrderConfirmed,
  onBack,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExp, setCardExp] = useState('08/28');
  const [cardCvc, setCardCvc] = useState('888');

  const sym = supplier.currencySymbol || country.currencySymbol || '€';
  const isMetric = units === 'metric';

  // Compute pricing in local currency
  const pricePerUnit = isMetric ? supplier.pricePerM3 : supplier.pricePerYd3;
  const orderedVolume = isMetric ? finalVolumeM3 : finalVolumeYd3;
  const concreteCost = Math.round(orderedVolume * pricePerUnit * 100) / 100;

  // Pourwise Share pool discount
  const poolTier = getPoolTier(deliveryFlexDays);
  const poolDiscount = Math.round(concreteCost * (poolTier.discountPercent / 100) * 100) / 100;

  const truckCap = isMetric ? supplier.truckCapacityM3 : supplier.truckCapacityYd3;
  const truckSplit = splitTruckloads(finalVolumeYd3, supplier.truckCapacityYd3, isBalanced);
  const deliveryFee = truckSplit.trucks.length * (isMetric ? 55.0 : 65.0);
  const shortLoadFee = truckSplit.isShortLoad && !isBalanced ? supplier.shortLoadFee : 0;

  const totalEstimated = Math.max(0, Math.round((concreteCost + deliveryFee + shortLoadFee - poolDiscount) * 100) / 100);
  const depositPaid = Math.round(totalEstimated * 0.15 * 100) / 100; // 15% deposit

  const handleFillDemoCard = () => {
    setCardNumber('4000 1234 5678 9010');
    setCardExp('12/28');
    setCardCvc('321');
  };

  const handlePayDepositAndConfirm = async () => {
    setSubmitting(true);
    const orderId = `${country.code}-${Math.floor(100000 + Math.random() * 900000)}`;

    const initialTrucks: TruckItem[] = truckSplit.trucks.map((trk, i) => {
      const isFirst = i === 0;
      return {
        truckNumber: trk.truckNumber,
        volumeYd3: trk.volumeYd3,
        volumeM3: trk.volumeM3,
        status: 'preparing',
        batchTime: isFirst ? Date.now() : null,
        departTime: null,
        arrivalTime: null,
        finishTime: null,
        etaMinutes: isFirst ? 25 : 55,
        waitingMinutesIncurred: 0,
        waitingFeeIncurred: 0,
      };
    });

    const newOrder: OrderRecord = {
      id: orderId,
      userId: user?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'confirmed',
      country: country.code,
      currency: supplier.currency || country.currency,
      currencySymbol: sym,
      customerName: contactName,
      customerPhone: contactPhone,
      address,
      accessNotes,
      deliveryDate,
      deliveryTimeSlot,
      deliveryFlexDays,
      poolDiscountPercent: poolTier.discountPercent,
      poolSavings: poolDiscount,
      supplierId: supplier.id,
      supplierName: supplier.name,
      concreteMix: mix,
      areaSqFt: scaleConfig.computedAreaSqFt,
      areaSqM: scaleConfig.computedAreaSqM,
      depthInches,
      depthCm: Math.round(depthInches * 2.54 * 10) / 10,
      baseVolumeYd3: Math.round(((scaleConfig.computedAreaSqFt * (depthInches / 12)) / 27) * 100) / 100,
      baseVolumeM3: Math.round((scaleConfig.computedAreaSqM * ((depthInches * 2.54) / 100)) * 100) / 100,
      wastePercent,
      finalVolumeYd3,
      finalVolumeM3,
      manualOverride,
      truckloadsCount: truckSplit.trucks.length,
      trucks: initialTrucks,
      pricing: {
        concreteCost,
        deliveryFee,
        shortLoadFee,
        depositPaid,
        totalEstimated,
      },
      checklist,
      penaltiesUnderstood: understoodPenalties,
      recapCompleted: false,
    };

    const orderPath = `orders/${orderId}`;
    try {
      await setDoc(doc(db, 'orders', orderId), newOrder);
      onOrderConfirmed(newOrder);
    } catch (err) {
      console.error('Failed to store order in Firestore:', err);
      onOrderConfirmed(newOrder);
      handleFirestoreError(err, OperationType.CREATE, orderPath);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="text-base font-black text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-400" />
          <span>{t(language, 'screen9Title')}</span>
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          {country.flag} {country.name} · {supplier.name}
        </div>
      </div>

      {/* 1. Order Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          {t(language, 'orderSummary')}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Volume Total</span>
            <span className="font-mono font-black text-white text-base">
              {isMetric ? `${finalVolumeM3} m³` : `${finalVolumeYd3} yd³`}
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Toupies Mixer</span>
            <span className="font-mono font-black text-amber-400 text-base">
              {truckSplit.trucks.length} {truckSplit.trucks.length === 1 ? 'Toupie' : 'Toupies'}
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Formule Béton</span>
            <span className="font-bold text-white truncate block">
              {mix.strength}
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Coulage</span>
            <span className="font-bold text-white capitalize truncate block">{mix.placement}</span>
          </div>
        </div>

        {/* Schedule & Address row */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Date & Créneau :</span>
            <span className="font-bold text-white">
              {deliveryDate} · {deliveryTimeSlot}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Chantier :</span>
            <span className="font-bold text-white truncate max-w-[240px]">{address}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Centrale Partenaire :</span>
            <span className="font-bold text-amber-400">{supplier.name}</span>
          </div>
        </div>
      </div>

      {/* 2. Price Breakdown Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-xl">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          {t(language, 'priceBreakdown')} ({country.currency})
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>
              {t(language, 'concreteMaterial')} ({orderedVolume} {isMetric ? 'm³' : 'yd³'} @ {sym}
              {pricePerUnit})
            </span>
            <span className="font-mono font-bold text-white">
              {sym}{concreteCost.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between text-slate-300">
            <span>{t(language, 'deliveryCharge')} ({truckSplit.trucks.length} toupies)</span>
            <span className="font-mono font-bold text-white">
              {sym}{deliveryFee.toFixed(2)}
            </span>
          </div>

          {shortLoadFee > 0 && (
            <div className="flex justify-between text-rose-400 font-bold">
              <span>{t(language, 'shortLoadCharge')}</span>
              <span className="font-mono">+{sym}{shortLoadFee.toFixed(2)}</span>
            </div>
          )}

          {poolTier.discountPercent > 0 && (
            <div className="flex justify-between text-emerald-400 font-bold bg-emerald-950/20 px-2 py-1 rounded">
              <span>🌱 Pourwise Share (-{poolTier.discountPercent}% pool)</span>
              <span className="font-mono">-{sym}{poolDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-white">
            <span>{t(language, 'estimatedTotal')}</span>
            <span className="font-mono text-xl font-black text-amber-400 tabular-nums">
              {sym}{totalEstimated.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Deposit Highlight */}
        <div className="bg-amber-950/30 border border-amber-500/60 rounded-xl p-3 flex items-center justify-between text-xs">
          <div>
            <div className="font-extrabold text-amber-300">{t(language, 'depositDue')}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {t(language, 'balanceOnDelivery')}
            </div>
          </div>
          <div className="font-mono text-2xl font-black text-amber-400 tabular-nums">
            {sym}{depositPaid.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 3. Simulated Checkout Form */}
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Paiement Sécurisé Simulé (Mode Test)</span>
          </div>

          <button
            type="button"
            onClick={handleFillDemoCard}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>{t(language, 'fillDemoCard')}</span>
          </button>
        </div>

        {/* Card Number */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1">
            {t(language, 'cardNumber')}
          </label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className="w-full h-11 px-3 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-sm font-mono font-bold text-white"
          />
        </div>

        {/* Exp & CVC */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              {t(language, 'cardExp')}
            </label>
            <input
              type="text"
              value={cardExp}
              onChange={(e) => setCardExp(e.target.value)}
              className="w-full h-11 px-3 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-sm font-mono font-bold text-white text-center"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              {t(language, 'cardCvc')}
            </label>
            <input
              type="password"
              maxLength={4}
              value={cardCvc}
              onChange={(e) => setCardCvc(e.target.value)}
              className="w-full h-11 px-3 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-sm font-mono font-bold text-white text-center"
            />
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex-1 min-h-[54px] py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition touch-manipulation cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t(language, 'back')}</span>
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={handlePayDepositAndConfirm}
          className="flex-[2] min-h-[58px] py-4 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-amber-400/25 transition disabled:opacity-50 touch-manipulation cursor-pointer border-2 border-amber-300"
        >
          {submitting ? (
            <span>Transmission à la Centrale...</span>
          ) : (
            <>
              <span>Régler l'acompte de {sym}{depositPaid.toFixed(2)}</span>
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

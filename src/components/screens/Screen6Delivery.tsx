import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Calendar,
  Clock,
  Phone,
  User as UserIcon,
  Star,
  ArrowRight,
  ArrowLeft,
  Globe,
  Sparkles,
  ShieldCheck,
  Check,
  Building2,
  Navigation,
  Users,
} from 'lucide-react';
import type { Language, UnitSystem, Supplier, CountryConfig, UserProfile } from '../../types/index.ts';
import { t } from '../../utils/i18n.ts';
import { getPoolTier } from '../../utils/pool.ts';

interface Screen6DeliveryProps {
  language: Language;
  units: UnitSystem;
  country: CountryConfig;
  user?: UserProfile | null;
  deliveryDate: string;
  onDeliveryDateChanged: (date: string) => void;
  deliveryTimeSlot: string;
  onDeliveryTimeSlotChanged: (slot: string) => void;
  deliveryFlexDays: number;
  onDeliveryFlexDaysChanged: (days: number) => void;
  address: string;
  onAddressChanged: (address: string) => void;
  accessNotes: string;
  onAccessNotesChanged: (notes: string) => void;
  contactName: string;
  onContactNameChanged: (name: string) => void;
  contactPhone: string;
  onContactPhoneChanged: (phone: string) => void;
  suppliers: Supplier[];
  selectedSupplierId: string;
  onSupplierSelected: (supplier: Supplier) => void;
  onOpenCountryModal: () => void;
  onNext: () => void;
  onBack: () => void;
}

export const Screen6Delivery: React.FC<Screen6DeliveryProps> = ({
  language,
  units,
  country,
  user,
  deliveryDate,
  onDeliveryDateChanged,
  deliveryTimeSlot,
  onDeliveryTimeSlotChanged,
  deliveryFlexDays,
  onDeliveryFlexDaysChanged,
  address,
  onAddressChanged,
  accessNotes,
  onAccessNotesChanged,
  contactName,
  onContactNameChanged,
  contactPhone,
  onContactPhoneChanged,
  suppliers,
  selectedSupplierId,
  onSupplierSelected,
  onOpenCountryModal,
  onNext,
  onBack,
}) => {
  const [gpsLoading, setGpsLoading] = useState(false);

  const timeSlots = [
    '07:00 AM (1ère Toupie / Première rotation)',
    '08:30 AM (Matinée standard)',
    '10:00 AM (Milieu de matinée)',
    '11:30 AM (Fin de matinée)',
    '01:00 PM (Reprise après-midi)',
    '02:30 PM (Après-midi)',
    '04:00 PM (Fin de journée chantier)',
  ];

  // Filter suppliers by selected country
  const countrySuppliers = suppliers.filter((s) => s.country === country.code);
  const displaySuppliers = countrySuppliers.length > 0 ? countrySuppliers : suppliers;

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        const defaultCity = country.cityExamples[0] || 'Chantier';
        onAddressChanged(`${defaultCity} (${lat}, ${lng}) — Accès chantier direct`);
        setGpsLoading(false);
      },
      () => {
        const defaultCity = country.cityExamples[0] || 'Chantier Principal';
        onAddressChanged(`12 Rue du Chantier, ${defaultCity}`);
        setGpsLoading(false);
      },
      { timeout: 6000 }
    );
  };

  const handleAddQuickNote = (noteSnippet: string) => {
    if (!accessNotes.includes(noteSnippet)) {
      onAccessNotesChanged(accessNotes ? `${accessNotes}, ${noteSnippet}` : noteSnippet);
    }
  };

  const handleAutofillUser = () => {
    if (user) {
      onContactNameChanged(user.name);
    }
  };

  const sym = country.currencySymbol;
  const isMetric = units === 'metric';

  return (
    <div className="space-y-4">
      {/* Title & Country Switcher */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-black tracking-wider text-amber-400">
              {country.flag} {country.name} · {country.currency}
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
              {displaySuppliers.length} Centrales disponibles
            </span>
          </div>
          <div className="text-base font-black text-white flex items-center gap-2 mt-1">
            <Truck className="w-5 h-5 text-amber-400" />
            <span>Livraison & Choix de la Centrale à Béton</span>
          </div>
          <div className="text-xs text-slate-400">
            Sélectionnez votre centrale locale, l'adresse du chantier et l'horaire de coulage
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCountryModal}
          className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 flex items-center gap-1.5 border border-slate-700 transition cursor-pointer active:scale-95 shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <span>Changer de Pays</span>
        </button>
      </div>

      {/* 1. READY-MIX SUPPLIERS MARKETPLACE */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <label className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Centrales Certifiées dans votre Région</span>
          </label>
          <span className="text-[11px] text-amber-400 font-bold font-mono">
            {language === 'fr' ? 'Tarifs Garantis Powise' : 'Powise Guaranteed Pricing'}
          </span>
        </div>

        <div className="space-y-3">
          {displaySuppliers.map((sup) => {
            const isSelected = selectedSupplierId === sup.id;
            const price = isMetric ? sup.pricePerM3 : sup.pricePerYd3;
            const priceUnit = isMetric ? t(language, 'pricePerM3') : t(language, 'pricePerYd3');

            return (
              <div
                key={sup.id}
                onClick={() => onSupplierSelected(sup)}
                className={`p-4 rounded-xl border-2 transition cursor-pointer relative ${
                  isSelected
                    ? 'bg-amber-400/5 border-amber-400 shadow-lg shadow-amber-400/10'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white">{sup.name}</span>
                      <span className="flex items-center text-xs font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                        <Star className="w-3 h-3 fill-amber-400 mr-1" />
                        {sup.rating}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{sup.location}</span>
                    </div>

                    {sup.badge && (
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        <ShieldCheck className="w-3 h-3" />
                        {sup.badge}
                      </div>
                    )}
                  </div>

                  <div className="sm:text-right flex items-center sm:block justify-between pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div>
                      <div className="text-2xl font-black text-amber-400 font-mono tabular-nums leading-none">
                        {sym}{price}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{priceUnit}</div>
                    </div>

                    <div className="sm:mt-2">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs">
                          <Check className="w-3 h-3 stroke-[3]" /> Sélectionné
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-slate-400 group-hover:text-white font-bold">
                          Choisir cette centrale
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key terms summary row */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Capacité toupie :</span>
                    <span className="font-bold text-white font-mono">
                      {isMetric ? `${sup.truckCapacityM3} m³` : `${sup.truckCapacityYd3} yd³`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Déchargement libre :</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {sup.freeUnloadMinutes} min incluses
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Attente :</span>
                    <span className="font-bold text-amber-400 font-mono">
                      {sym}{sup.waitingFeePerMin.toFixed(2)}/min
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Sous-charge :</span>
                    <span className="font-mono text-slate-300">
                      {sym}{sup.shortLoadFee}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. DATE, TIME SLOT & POURWISE SHARE FLEXIBILITY */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Date & Créneau de Première Toupie</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-mono font-bold">
            🌱 Pourwise Share Activé
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="block text-xs font-semibold text-slate-400 mb-1">
              Date de coulage souhaitée :
            </span>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => onDeliveryDateChanged(e.target.value)}
              className="w-full h-12 px-3.5 bg-slate-900 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm font-bold text-white transition"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Créneau d'arrivée sur site :</span>
            </span>
            <select
              value={deliveryTimeSlot}
              onChange={(e) => onDeliveryTimeSlotChanged(e.target.value)}
              className="w-full h-12 px-3.5 bg-slate-900 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm font-bold text-white transition cursor-pointer"
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pourwise Share Slider in Delivery step */}
        {(() => {
          const tier = getPoolTier(deliveryFlexDays);
          return (
            <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black text-white">
                    Délai Flexible Groupé (1 à 90 jours) :
                  </span>
                </div>
                <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  {deliveryFlexDays === 1 ? 'Date Fixe (0% remise)' : `Sous ${deliveryFlexDays}j (-${tier.discountPercent}%)`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="90"
                  step="1"
                  value={deliveryFlexDays}
                  onChange={(e) => onDeliveryFlexDaysChanged(parseInt(e.target.value, 10))}
                  className="flex-1 accent-emerald-400 h-2.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-slate-300 w-12 text-right">
                  {deliveryFlexDays}j
                </span>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>{language === 'fr' ? tier.nameFr : tier.name}</span>
                <span className="text-emerald-400 font-bold">
                  {tier.discountPercent > 0 ? `-${tier.discountPercent}% sur le béton` : 'Date exacte'}
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 3. SITE ADDRESS & GPS LOCATION */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-lg">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Adresse du Chantier & Accès Camions</span>
          </label>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={gpsLoading}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20 active:scale-95 transition"
          >
            <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? 'Géolocalisation...' : 'Position GPS actuelle'}</span>
          </button>
        </div>

        <input
          type="text"
          value={address}
          placeholder="Ex : 24 Rue de la Paix, Paris ou Coordonnées GPS du portail"
          onChange={(e) => onAddressChanged(e.target.value)}
          className="w-full h-12 px-3.5 bg-slate-900 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm font-semibold text-white placeholder-slate-500 transition"
        />

        {/* Access Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Consignes d'accès pour les chauffeurs toupies :
          </label>
          <input
            type="text"
            value={accessNotes}
            placeholder="Code portail, câbles électriques, voie étroite, sol stabilisé..."
            onChange={(e) => onAccessNotesChanged(e.target.value)}
            className="w-full h-11 px-3.5 bg-slate-900 border border-slate-700/80 focus:border-amber-400 rounded-xl text-xs text-slate-200 transition"
          />

          {/* Quick-tap tags */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              'Code portail',
              'Câbles électriques bas',
              'Marche arrière nécessaire',
              'Sol boueux / accès stabilisé',
              'Goulotte max déployée',
            ].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddQuickNote(tag)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 text-[11px] text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-400/40 transition cursor-pointer"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. CONTACT INFORMATION */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-lg">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-amber-400" />
            <span>Contact Chef de Chantier</span>
          </label>

          {user && (
            <button
              type="button"
              onClick={handleAutofillUser}
              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
            >
              <Check className="w-3 h-3" />
              <span>Utiliser profil Google</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="block text-xs font-semibold text-slate-400 mb-1">
              Nom & Prénom (Chef de chantier) :
            </span>
            <input
              type="text"
              value={contactName}
              placeholder="Ex : Marc Dupont"
              onChange={(e) => onContactNameChanged(e.target.value)}
              className="w-full h-12 px-3.5 bg-slate-900 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm font-bold text-white placeholder-slate-500 transition"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Téléphone joignable le jour du coulage :</span>
            </span>
            <input
              type="tel"
              value={contactPhone}
              placeholder={`${country.phoneCode} 6 12 34 56 78`}
              onChange={(e) => onContactPhoneChanged(e.target.value)}
              className="w-full h-12 px-3.5 bg-slate-900 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm font-bold text-white placeholder-slate-500 font-mono transition"
            />
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 min-h-[52px] py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t(language, 'back')}</span>
        </button>

        <button
          type="button"
          disabled={!address || !contactName || !contactPhone}
          onClick={onNext}
          className="flex-[2] min-h-[52px] py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-400/25 transition disabled:opacity-50 cursor-pointer border-2 border-amber-300"
        >
          <span>Vérifier Liste Chantier Prêt</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type {
  Language,
  UnitSystem,
  OutlineResult,
  ScaleConfig,
  ConcreteMix,
  Supplier,
  SiteChecklist,
  OrderRecord,
  CountryConfig,
  UserProfile,
} from './types/index.ts';
import { Header } from './components/Header.tsx';
import { CountryModal } from './components/CountryModal.tsx';
import { AuthUserModal } from './components/AuthUserModal.tsx';
import { StepProgress } from './components/StepProgress.tsx';
import { QuickOrderView } from './components/screens/QuickOrderView.tsx';
import { Screen1Photo } from './components/screens/Screen1Photo.tsx';
import { Screen2Outline } from './components/screens/Screen2Outline.tsx';
import { Screen3Scale } from './components/screens/Screen3Scale.tsx';
import { Screen4DepthMix } from './components/screens/Screen4DepthMix.tsx';
import { Screen5Volume } from './components/screens/Screen5Volume.tsx';
import { Screen6Delivery } from './components/screens/Screen6Delivery.tsx';
import { Screen7Checklist } from './components/screens/Screen7Checklist.tsx';
import { Screen8Penalties } from './components/screens/Screen8Penalties.tsx';
import { Screen9SummaryPayment } from './components/screens/Screen9SummaryPayment.tsx';
import { ForemanTrackingView } from './components/screens/ForemanTrackingView.tsx';
import { SupplierPlantView } from './components/screens/SupplierPlantView.tsx';
import { COUNTRIES, WORLDWIDE_SUPPLIERS } from './data/countries.ts';
import { seedDemoSuppliersIfEmpty, db } from './firebase.ts';
import { subscribeToAuth } from './auth.ts';
import { createSampleSlabImage } from './utils/sampleImages.ts';
import { Zap, Camera, Globe, ArrowRight, Sparkles, Building2, Truck } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { t } from './utils/i18n.ts';

export default function App() {
  // Global Country & Local Settings
  // Default to France (FR) or first country
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(COUNTRIES[0]);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ordersList, setOrdersList] = useState<OrderRecord[]>([]);

  const [language, setLanguage] = useState<Language>('en'); // Default English as requested
  const [units, setUnits] = useState<UnitSystem>('metric');

  // Navigation: 'order' | 'tracking' | 'plant'
  const [activeTab, setActiveTab] = useState<'order' | 'tracking' | 'plant'>('order');

  // Order Flow Mode: 'quick' (Fast 60-second booking) vs 'photo' (AI Photo Survey 9-step)
  const [orderMode, setOrderMode] = useState<'quick' | 'photo'>('quick');
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Screen 1: Photo
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Screen 2: Outline
  const [outlineResult, setOutlineResult] = useState<OutlineResult | null>(null);

  // Screen 3: Scale
  const [scaleConfig, setScaleConfig] = useState<ScaleConfig>({
    mode: 'mark_known',
    pointA: { x: 0.25, y: 0.21 },
    pointB: { x: 0.6, y: 0.19 },
    realLength: 3.0,
    manualLength: 8.0,
    manualWidth: 5.0,
    computedAreaSqFt: 430,
    computedAreaSqM: 40,
    source: 'photo_reference',
  });

  // Screen 4: Depth & Mix Spec
  const [depthInches, setDepthInches] = useState<number>(4.72); // ~12 cm
  const [mix, setMix] = useState<ConcreteMix>({
    strength: COUNTRIES[0].defaultStrength,
    slump: 'S3 (100-150 mm)',
    maxAggregate: '20 mm (Standard)',
    airEntrained: false,
    fibers: false,
    placement: 'chute',
  });

  // Screen 5: Volume
  const [wastePercent, setWastePercent] = useState<number>(5);
  const [truckCapacityYd3, setTruckCapacityYd3] = useState<number>(10.5);
  const [manualOverrideYd3, setManualOverrideYd3] = useState<number | null>(null);
  const [isBalanced, setIsBalanced] = useState<boolean>(false);

  // Calculated volumes stored
  const [calculatedAreaSqFt, setCalculatedAreaSqFt] = useState<number>(430);
  const [calculatedAreaSqM, setCalculatedAreaSqM] = useState<number>(40);
  const [finalVolumeYd3, setFinalVolumeYd3] = useState<number>(6.5);
  const [finalVolumeM3, setFinalVolumeM3] = useState<number>(5.0);

  // Suppliers & Delivery
  const [suppliers, setSuppliers] = useState<Supplier[]>(WORLDWIDE_SUPPLIERS);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier>(() => {
    return WORLDWIDE_SUPPLIERS.find((s) => s.country === COUNTRIES[0].code) || WORLDWIDE_SUPPLIERS[0];
  });

  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<string>('07:00 AM (1ère Toupie / Première rotation)');
  const [address, setAddress] = useState<string>('24 Avenue du Chantier, Paris');
  const [accessNotes, setAccessNotes] = useState<string>('Code portail #4012, accès direct toupie stabilisé');
  const [contactName, setContactName] = useState<string>('Marc Dupont (Chef de Chantier)');
  const [contactPhone, setContactPhone] = useState<string>('+33 6 12 34 56 78');
  const [deliveryFlexDays, setDeliveryFlexDays] = useState<number>(14); // Default 14-day Pourwise Share window (-15% discount)

  // Checklist & Penalties
  const [checklist, setChecklist] = useState<SiteChecklist>({
    formsSetAndBraced: true,
    rebarMeshInPlace: true,
    subgradeCompacted: true,
    inspectionPassed: true,
    crewOnSite: true,
    pumpBooked: false,
    truckAccessOk: true,
    acknowledgedWarning: false,
  });
  const [understoodPenalties, setUnderstoodPenalties] = useState<boolean>(false);

  // Active Order for Tracking
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);

  // Google Authentication Listener
  useEffect(() => {
    const unsubscribe = subscribeToAuth((loggedUser) => {
      setUser(loggedUser);
      if (loggedUser && (!contactName || contactName.includes('Marc Dupont'))) {
        setContactName(loggedUser.name);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore orders
  useEffect(() => {
    try {
      const q = collection(db, 'orders');
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const ords: OrderRecord[] = [];
          snapshot.forEach((d) => ords.push(d.data() as OrderRecord));
          ords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrdersList(ords);
        },
        (err) => {
          console.warn('Orders snapshot listener:', err);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Orders listener setup error:', e);
    }
  }, []);

  // Initialize Suppliers & Sample Image
  useEffect(() => {
    seedDemoSuppliersIfEmpty().then((loaded) => {
      if (loaded && loaded.length > 0) {
        setSuppliers(loaded);
        const match = loaded.find((s) => s.country === selectedCountry.code);
        if (match) {
          setSelectedSupplier(match);
          setTruckCapacityYd3(match.truckCapacityYd3);
        }
      }
    });

    const handleHash = () => {
      const h = window.location.hash.replace('#', '');
      const params = new URLSearchParams(window.location.search);
      const appParam = params.get('app') || params.get('portal');
      if (appParam === 'plant' || window.location.pathname === '/plant' || h === 'plant') {
        setActiveTab('plant');
      } else if (appParam === 'tracking' || h === 'tracking') {
        setActiveTab('tracking');
      } else if (appParam === 'order' || h === 'order') {
        setActiveTab('order');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);

    if (!photoUrl) {
      setPhotoUrl(createSampleSlabImage('patio'));
    }
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // When Country changes
  const handleSelectCountry = (country: CountryConfig) => {
    setSelectedCountry(country);
    setUnits(country.defaultUnits);
    setMix((prev) => ({
      ...prev,
      strength: country.defaultStrength,
    }));

    // Find supplier in that country
    const match = suppliers.find((s) => s.country === country.code);
    if (match) {
      setSelectedSupplier(match);
      setTruckCapacityYd3(match.truckCapacityYd3);
    }

    // Update sample address
    const sampleCity = country.cityExamples[0] || 'Chantier';
    setAddress(`12 Rue du Chantier, ${sampleCity}`);
    setContactPhone(`${country.phoneCode} 6 00 00 00 00`);
  };

  const handleOrderConfirmed = (confirmedOrder: OrderRecord) => {
    setActiveOrder(confirmedOrder);
    setOrdersList((prev) => [confirmedOrder, ...prev.filter((o) => o.id !== confirmedOrder.id)]);
    setActiveTab('tracking');
  };

  const handleResetForNewOrder = () => {
    setCurrentStep(1);
    setOrderMode('quick');
    setPhotoUrl(createSampleSlabImage('patio'));
    setOutlineResult(null);
    setManualOverrideYd3(null);
    setIsBalanced(false);
    setUnderstoodPenalties(false);
    setActiveTab('order');
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        units={units}
        onUnitsChange={setUnits}
        country={selectedCountry}
        onOpenCountryModal={() => setIsCountryModalOpen(true)}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.location.hash = tab;
        }}
        hasActiveOrder={!!activeOrder}
      />

      {/* Country Selection Modal */}
      <CountryModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        selectedCountry={selectedCountry}
        onSelectCountry={handleSelectCountry}
        language={language}
      />

      {/* Auth & User Profile Modal */}
      <AuthUserModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        onUserChanged={(u) => {
          setUser(u);
          if (u && (!contactName || contactName.includes('Marc Dupont'))) {
            setContactName(u.name);
          }
        }}
        orders={ordersList}
        onSelectOrderToTrack={(ord) => {
          setActiveOrder(ord);
          setActiveTab('tracking');
        }}
        language={language}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-3.5 py-4">
        {/* TAB 1: ORDER CONCRETE */}
        {activeTab === 'order' && (
          <div className="space-y-4">
            {/* Mode Switcher: Quick Calculator vs AI Photo Survey */}
            <div className="bg-[#0F172A]/90 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setOrderMode('quick');
                  setCurrentStep(1);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                  orderMode === 'quick'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>{t(language, 'modeQuick')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOrderMode('photo');
                  setCurrentStep(1);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                  orderMode === 'photo'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{t(language, 'modePhoto')}</span>
              </button>
            </div>

            {/* A: QUICK ORDER MODE (Streamlined Fast Booking) */}
            {orderMode === 'quick' && currentStep === 1 && (
              <QuickOrderView
                language={language}
                units={units}
                country={selectedCountry}
                supplier={selectedSupplier}
                depthInches={depthInches}
                onDepthChanged={setDepthInches}
                deliveryFlexDays={deliveryFlexDays}
                onDeliveryFlexDaysChanged={setDeliveryFlexDays}
                mix={mix}
                onMixChanged={setMix}
                wastePercent={wastePercent}
                onWasteChanged={setWastePercent}
                onVolumeCalculated={({
                  areaSqFt,
                  areaSqM,
                  depthInches: dIn,
                  finalVolumeYd3: fYd,
                  finalVolumeM3: fM3,
                }) => {
                  setCalculatedAreaSqFt(areaSqFt);
                  setCalculatedAreaSqM(areaSqM);
                  setDepthInches(dIn);
                  setFinalVolumeYd3(fYd);
                  setFinalVolumeM3(fM3);
                  setScaleConfig((prev) => ({
                    ...prev,
                    computedAreaSqFt: areaSqFt,
                    computedAreaSqM: areaSqM,
                  }));
                }}
                onProceedToDelivery={() => setCurrentStep(6)}
                onSwitchToPhotoMeasure={() => {
                  setOrderMode('photo');
                  setCurrentStep(1);
                }}
              />
            )}

            {/* B: AI PHOTO MEASURE 9-STEP WORKFLOW */}
            {orderMode === 'photo' && currentStep <= 5 && (
              <div className="space-y-4">
                <StepProgress
                  currentStep={currentStep}
                  totalSteps={9}
                  onStepClick={(s) => {
                    if (s <= currentStep || (photoUrl && s <= 3)) {
                      setCurrentStep(s);
                    }
                  }}
                  language={language}
                />

                {currentStep === 1 && (
                  <Screen1Photo
                    language={language}
                    photoUrl={photoUrl}
                    onPhotoSelected={(url) => {
                      setPhotoUrl(url);
                      setOutlineResult(null);
                    }}
                    onNext={() => setCurrentStep(2)}
                  />
                )}

                {currentStep === 2 && photoUrl && (
                  <Screen2Outline
                    language={language}
                    photoUrl={photoUrl}
                    outlineResult={outlineResult}
                    onOutlineUpdated={setOutlineResult}
                    onNext={() => setCurrentStep(3)}
                    onBack={() => setCurrentStep(1)}
                  />
                )}

                {currentStep === 3 && photoUrl && outlineResult && (
                  <Screen3Scale
                    language={language}
                    units={units}
                    photoUrl={photoUrl}
                    outlineResult={outlineResult}
                    scaleConfig={scaleConfig}
                    onScaleUpdated={(cfg) => {
                      setScaleConfig(cfg);
                      setCalculatedAreaSqFt(cfg.computedAreaSqFt);
                      setCalculatedAreaSqM(cfg.computedAreaSqM);
                    }}
                    onNext={() => setCurrentStep(4)}
                    onBack={() => setCurrentStep(2)}
                  />
                )}

                {currentStep === 4 && (
                  <Screen4DepthMix
                    language={language}
                    units={units}
                    depthInches={depthInches}
                    onDepthChanged={setDepthInches}
                    mix={mix}
                    onMixChanged={setMix}
                    onNext={() => setCurrentStep(5)}
                    onBack={() => setCurrentStep(3)}
                  />
                )}

                {currentStep === 5 && (
                  <Screen5Volume
                    language={language}
                    units={units}
                    scaleConfig={scaleConfig}
                    depthInches={depthInches}
                    wastePercent={wastePercent}
                    onWasteChanged={setWastePercent}
                    truckCapacityYd3={truckCapacityYd3}
                    onTruckCapacityChanged={setTruckCapacityYd3}
                    manualOverrideYd3={manualOverrideYd3}
                    onManualOverrideChanged={setManualOverrideYd3}
                    isBalanced={isBalanced}
                    onToggleBalanced={setIsBalanced}
                    onNext={() => setCurrentStep(6)}
                    onBack={() => setCurrentStep(4)}
                  />
                )}
              </div>
            )}

            {/* COMMON ORDER COMPLETION SCREENS (Steps 6, 7, 8, 9) */}
            {currentStep >= 6 && (
              <div className="space-y-4">
                <StepProgress
                  currentStep={currentStep}
                  totalSteps={9}
                  onStepClick={(s) => {
                    if (s <= currentStep) setCurrentStep(s);
                  }}
                  language={language}
                />

                {/* SCREEN 6: Delivery & Supplier */}
                {currentStep === 6 && (
                  <Screen6Delivery
                    language={language}
                    units={units}
                    country={selectedCountry}
                    user={user}
                    deliveryDate={deliveryDate}
                    onDeliveryDateChanged={setDeliveryDate}
                    deliveryTimeSlot={deliveryTimeSlot}
                    onDeliveryTimeSlotChanged={setDeliveryTimeSlot}
                    deliveryFlexDays={deliveryFlexDays}
                    onDeliveryFlexDaysChanged={setDeliveryFlexDays}
                    address={address}
                    onAddressChanged={setAddress}
                    accessNotes={accessNotes}
                    onAccessNotesChanged={setAccessNotes}
                    contactName={contactName}
                    onContactNameChanged={setContactName}
                    contactPhone={contactPhone}
                    onContactPhoneChanged={setContactPhone}
                    suppliers={suppliers}
                    selectedSupplierId={selectedSupplier.id}
                    onSupplierSelected={(sup) => {
                      setSelectedSupplier(sup);
                      setTruckCapacityYd3(sup.truckCapacityYd3);
                    }}
                    onOpenCountryModal={() => setIsCountryModalOpen(true)}
                    onNext={() => setCurrentStep(7)}
                    onBack={() => {
                      if (orderMode === 'quick') setCurrentStep(1);
                      else setCurrentStep(5);
                    }}
                  />
                )}

                {/* SCREEN 7: Site Ready Checklist */}
                {currentStep === 7 && (
                  <Screen7Checklist
                    language={language}
                    isPumpPlacement={mix.placement === 'pump'}
                    checklist={checklist}
                    onChecklistChanged={setChecklist}
                    onNext={() => setCurrentStep(8)}
                    onBack={() => setCurrentStep(6)}
                  />
                )}

                {/* SCREEN 8: Penalties Explained */}
                {currentStep === 8 && (
                  <Screen8Penalties
                    language={language}
                    supplier={selectedSupplier}
                    understood={understoodPenalties}
                    onUnderstoodChanged={setUnderstoodPenalties}
                    onNext={() => setCurrentStep(9)}
                    onBack={() => setCurrentStep(7)}
                  />
                )}

                {/* SCREEN 9: Summary & Payment */}
                {currentStep === 9 && (
                  <Screen9SummaryPayment
                    language={language}
                    units={units}
                    country={selectedCountry}
                    scaleConfig={scaleConfig}
                    depthInches={depthInches}
                    finalVolumeYd3={finalVolumeYd3}
                    finalVolumeM3={finalVolumeM3}
                    wastePercent={wastePercent}
                    manualOverride={manualOverrideYd3 !== null}
                    isBalanced={isBalanced}
                    mix={mix}
                    supplier={selectedSupplier}
                    deliveryDate={deliveryDate}
                    deliveryTimeSlot={deliveryTimeSlot}
                    deliveryFlexDays={deliveryFlexDays}
                    address={address}
                    accessNotes={accessNotes}
                    contactName={contactName}
                    contactPhone={contactPhone}
                    checklist={checklist}
                    understoodPenalties={understoodPenalties}
                    user={user}
                    onOrderConfirmed={handleOrderConfirmed}
                    onBack={() => setCurrentStep(8)}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIVE ORDER TRACKING (Foreman View) */}
        {activeTab === 'tracking' && (
          <div>
            {activeOrder ? (
              <ForemanTrackingView
                language={language}
                units={units}
                order={activeOrder}
                onOrderUpdated={setActiveOrder}
                onNewOrder={handleResetForNewOrder}
              />
            ) : (
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto text-3xl shadow-lg">
                  🏗️
                </div>
                <div>
                  <div className="text-lg font-black text-white">Aucune Commande en Cours de Suivi</div>
                  <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Effectuez une estimation rapide ou par photo pour réserver et suivre les camions toupies en direct.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('order')}
                  className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm transition cursor-pointer shadow-lg shadow-amber-400/20 active:scale-95"
                >
                  Commander du Béton
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PLANT DISPATCH CONSOLE (Supplier View) */}
        {activeTab === 'plant' && (
          <SupplierPlantView
            language={language}
            units={units}
            onSelectOrderForForeman={(selectedOrd) => {
              setActiveOrder(selectedOrd);
              setActiveTab('tracking');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070A12] py-4 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Powise Worldwide</span>
            <span>·</span>
            <span>Global Ready-Mix & Batch Plant Platform</span>
          </div>
          <div className="font-mono text-slate-400 flex items-center gap-1.5">
            <span>{selectedCountry.flag}</span>
            <span>{selectedCountry.name}</span>
            <span className="text-amber-400 font-bold">({selectedCountry.currencySymbol} {selectedCountry.currency})</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
